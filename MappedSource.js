import fs from 'node:fs';
import path from 'node:path';
import { SourceMapConsumer } from '@jridgewell/source-map';
import { LineMap } from "@toptensoftware/line-map";
import { EditableMappedSource } from "./EditableMappedSource.js";

/**
 * Manages the content of a read-only source file
 * providing both source mapping and 
 * offset/line/column mapping
 */
export class MappedSource
{
    /**
     * Constructs a new MappedSource
     * @param {string} filename The name of the file this source file was loaded from
     * @param {string} code The code content of the file
     * @param {SourceMapConsumer} sourceMap The loaded and parsed source map for the file
     */
    constructor(filename, code, sourceMap)
    {
        /**
         * The name of the file this source file was loaded from
         */
        this.filename = filename;
        /**
         * The code content of the file
         * @type {string}
         */
        this.code = code;

        /**
         * The source map for this file
         * @type {SourceMapConsumer}
         */
        this.sourceMap  = sourceMap;

        /**
         * The line number map for this file
         * @type {LineMap}
         */
        this.lineMap = this.code ? new LineMap(this.code, { lineBase : 1}) : null;
    }

    /**
     * Given an offset into the file returns an "original position"
     * which is either the original location if the file has a source
     * mapping and the point mapped to a position in another file.
     * Otherwise, returns the line:column in this file
     * @param {number} offset Offset in the file to map
     * @returns {{line: number, column: number, source: string}}
     */
    fromOffset(offset)
    {
        // Convert offset to line:column in this file
        let lp = this.lineMap.fromOffset(offset);
        return this.originalPositionFor(lp);
    }

    originalPositionFor(lp)
    {
        // If we've got a source map, try to map to an original location
        if (this.sourceMap)
        {
            // Lookup
            let lpo = this.sourceMap.originalPositionFor(lp);
            if (lpo && lpo.source)
            {
                // Found, create source file name relative to this file
                Object.assign({}, lpo);
                lpo.source = path.join(path.dirname(this.filename), lpo.source);
                return lpo;
            }
        }

        // Use this file.
        lp.source = this.filename;
        return lp;
    }

    /**
     * Loads a source file and its .map file
     * @param {string} sourceFileName Filename of the file to load
     * @param {string} mapFile Filename of the .map file to load.  Leave null to use name from source file.
     * @returns {SourceFile}
     */
    static fromFile(sourceFileName, mapFile)
    {
        // Read the source
        let code;
        if (sourceFileName)
        {
            code = fs.readFileSync(sourceFileName, "utf8");
        }

        // Work out map file
        if (!mapFile && code)
        {
            let mapName = /\/\/# sourceMappingURL=(.*)$/m.exec(code);
            if (mapName)
            {                
                mapFile = path.join(path.dirname(path.resolve(sourceFileName)), mapName[1]);
            }
        }

        // Load map
        let sourceMap;
        if (mapFile)
        {
            sourceMap = new SourceMapConsumer(JSON.parse(fs.readFileSync(mapFile, "utf8")));
        }

        // Create source file
        return new MappedSource(sourceFileName, code, sourceMap);
    }

    createEditable()
    {
        // Create offset mapping table
        let map = [];
        if (this.sourceMap)
        {
            this.sourceMap.eachMapping(x => {
                map.push({
                    offset: this.lineMap.toOffset(x.generatedLine, x.generatedColumn),
                    name: x.name,
                    source: x.source,
                    originalLine: x.originalLine,
                    originalColumn: x.originalColumn,
                });
            });
        }

        // Create EditableMappedSource
        return new EditableMappedSource(this.code, map);
    }
}