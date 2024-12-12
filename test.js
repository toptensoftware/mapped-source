import fs from "node:fs";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { EditableMappedSource } from "./EditableMappedSource.js";
import { MappedSource } from "./MappedSource.js";

test("slice", () => {

    let ms = new EditableMappedSource("Hello World!", [
        { offset: 6, name: "world start", },
        { offset: 11, name: "world end", },
    ]);

    let w = ms.substring(6, 11);
    assert.equal(w.code, "World");
    assert.equal(w.map.length, 2);
    assert.equal(w.map[0].offset, 0);
    assert.equal(w.map[1].offset, 5);

});

test("insert before", () => {

    let ms = new EditableMappedSource("Hello World!", [
        { offset: 6, name: "world start", },
        { offset: 11, name: "world end", },
    ]);

    let w = ms.insert(0, "!!!!!");
    assert.equal(ms.code, "!!!!!Hello World!");
    assert.equal(ms.map.length, 2);
    assert.equal(ms.map[0].offset, 11);
    assert.equal(ms.map[1].offset, 16);
});

test("insert at", () => {

    let ms = new EditableMappedSource("Hello World!", [
        { offset: 6, name: "world start", },
        { offset: 11, name: "world end", },
    ]);

    let w = ms.insert(6, "!!!!!");
    assert.equal(ms.code, "Hello !!!!!World!");
    assert.equal(ms.map.length, 2);
    assert.equal(ms.map[0].offset, 11);
    assert.equal(ms.map[1].offset, 16);
});

test("insert inside", () => {

    let ms = new EditableMappedSource("Hello World!", [
        { offset: 6, name: "world start", },
        { offset: 11, name: "world end", },
    ]);

    let w = ms.insert(8, "!!!!!");
    assert.equal(ms.code, "Hello Wo!!!!!rld!");
    assert.equal(ms.map.length, 2);
    assert.equal(ms.map[0].offset, 6);
    assert.equal(ms.map[1].offset, 16);
});

test("insert at end", () => {

    let ms = new EditableMappedSource("Hello World!", [
        { offset: 6, name: "world start", },
        { offset: 11, name: "world end", },
    ]);

    let w = ms.insert(11, "!!!!!");
    assert.equal(ms.code, "Hello World!!!!!!");
    assert.equal(ms.map.length, 2);
    assert.equal(ms.map[0].offset, 6);
    assert.equal(ms.map[1].offset, 16);
});

test("insert after", () => {

    let ms = new EditableMappedSource("Hello World!", [
        { offset: 6, name: "world start", },
        { offset: 11, name: "world end", },
    ]);

    let w = ms.insert(12, "!!!!!");
    assert.equal(ms.code, "Hello World!!!!!!");
    assert.equal(ms.map.length, 2);
    assert.equal(ms.map[0].offset, 6);
    assert.equal(ms.map[1].offset, 11);
});

test("delete before", () => {

    let ms = new EditableMappedSource("Hello World!", [
        { offset: 6, name: "world start", },
        { offset: 11, name: "world end", },
    ]);

    let w = ms.delete(0, 5);
    assert.equal(ms.code, " World!");
    assert.equal(ms.map.length, 2);
    assert.equal(ms.map[0].offset, 1);
    assert.equal(ms.map[1].offset, 6);
});

test("delete at", () => {

    let ms = new EditableMappedSource("Hello World!", [
        { offset: 6, name: "world start", },
        { offset: 11, name: "world end", },
    ]);

    let w = ms.delete(0, 6);
    assert.equal(ms.code, "World!");
    assert.equal(ms.map.length, 2);
    assert.equal(ms.map[0].offset, 0);
    assert.equal(ms.map[1].offset, 5);
});

test("delete over one", () => {

    let ms = new EditableMappedSource("Hello World!", [
        { offset: 6, name: "world start", },
        { offset: 11, name: "world end", },
    ]);

    let w = ms.delete(3, 6);
    assert.equal(ms.code, "Helld!");
    assert.equal(ms.map.length, 1);
    assert.equal(ms.map[0].offset, 5);
});

test("delete over multiple", () => {

    let ms = new EditableMappedSource("Hello World!", [
        { offset: 6, name: "world start", },
        { offset: 11, name: "world end", },
    ]);

    let w = ms.delete(3, 9);
    assert.equal(ms.code, "Hel");
    assert.equal(ms.map.length, 0);
});

test("insert mapped", () => {

    let ms = new EditableMappedSource("Hello World!", [
        { offset: 6, name: "world start", },
        { offset: 11, name: "world end", },
    ]);
    let ms2 = new EditableMappedSource("there ", [
        { offset: 0, name: "there start", },
        { offset: 5, name: "there end", },
    ]);

    let w = ms.insert(6, ms2);
    assert.equal(ms.code, "Hello there World!");
    assert.equal(ms.map.length, 4);
    assert.equal(ms.map[0].offset, 6);
    assert.equal(ms.map[0].name, "there start");
    assert.equal(ms.map[1].offset, 11);
    assert.equal(ms.map[1].name, "there end");
    assert.equal(ms.map[2].offset, 12);
    assert.equal(ms.map[2].name, "world start");
    assert.equal(ms.map[3].offset, 17);
    assert.equal(ms.map[3].name, "world end");
});



test("save", () => {

    // Create  test file
    let ems = new EditableMappedSource("Hello World!\n", [
        { offset: 6, name: "world start", source: "original.txt", originalLine: 11, originalColumn: 16 },
        { offset: 11, name: "world end", source: "original.txt", originalLine: 11, originalColumn: 21 },
    ]);
    ems.save("test.txt");

    let originalTxt = fs.readFileSync("test.txt", "utf8");
    let originalMap = fs.readFileSync("test.txt.map", "utf8");

    // Load it
    let ms = MappedSource.fromFile("test.txt");

    // Create another editable
    let ems2 = ms.createEditable();
    ems2.save("test.txt");

    let resavedTxt = fs.readFileSync("test.txt", "utf8");
    let resavedMap = fs.readFileSync("test.txt.map", "utf8");
    assert.equal(originalTxt, resavedTxt);
    assert.equal(originalMap, resavedMap);

    fs.unlinkSync("test.txt");
    fs.unlinkSync("test.txt.map");
});