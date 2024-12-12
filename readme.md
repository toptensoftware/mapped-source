# Mapped Source

Tools for reading and editing source mapped files

## Installation

```
npm install --save toptensoftware/mapped-source
```

## Usage

Load a file

```js
let ms = MappedSource.fromFile("file.js");
```

### Reading

* `filename` - name of the loaded file
* `code` - content of the file
* `lineMap` - a line mapping of offet to line/column position - [see here](https://github.com/toptensoftware/linemap)
* `sourceMap` - source map consume - [see here](https://github.com/jridgewell/source-map)
* `fromOffset` - given a file offset returns the original position (if mapped 
by source map file, otherwise position in this file).

```js
// File name
let filename = ms.filename;

// Code
let code = ms.code;

// LineMapping
let offset = ms.lineMap.toOffset({line: 10, column: 20});
let pos = ms.lineMap.fromOffset(1000);

// Returns source:null, line: null, column: null if not mapped
let originalPos = ms.sourceMap.originalPositionFor({line: 10, column: 20});

// Returns position in this file if not mapped
let originalPos = ms.originalPositionFor({line: 10, column: 20});
let originalPos = ms.fromOffset(1000);
```


## Editing

To edit a source mapped file, first load it as described above
then all `createEditable()` to get an `EditableMappedSource`

```js
let ems = MappedSource.fromFile("test.js").createEditable();
```

`EditableMappedSource` supports:

* `substring(start, end)` - returns a new `EditableMappedSource`
  with a subsection of the original string and cropped mapped points
* `splice(offset, length, str)` - replaces `length` characters at
  `offset` with `str`.
* `insert(offset, str)` - inserts `str` at `offset`.
* `delete(offset, length)` - deletes `length` characters at `offset`.
* `append(str)` - appends `str`.
* `save(filename)` - saves the file and source map

Note that `splice`, `insert` and `append` can accept either a `string`
or another `EditableMappedSource` as the string content parameter.  If
another `EditableMappedSource` is used, the source map is updated to 
include the new mapped points.


  
   