// Copyright 2011 Traceur Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {suite, test, assert} from '../../modular/testRunner.js';

suite('VariableBinder.js', function() {

  var ErrorReporter = traceur.util.ErrorReporter;
  var Parser = traceur.syntax.Parser;
  var SourceFile = traceur.syntax.SourceFile;
  var b = $traceurRuntime.ModuleStore.getForTesting('src/semantics/VariableBinder.js');
  var variablesInBlock = b.variablesInBlock;
  var variablesInFunction = b.variablesInFunction;

  function parse(code) {
    var errors = new ErrorReporter();
    var options = new traceur.util.Options();
    var tree = new Parser(new SourceFile('inline', code), errors, options).
        parseScript();
    assert.isFalse(errors.hadError());
    assert.equal(1, tree.scriptItemList.length);
    return tree.scriptItemList[0];
  }

  function idsToString(identifiers) {
    return identifiers.valuesAsArray().sort().join(',');
  }

  test('BoundIdentifiersInBlock', function() {
    assert.equal('f', idsToString(variablesInBlock(parse(
        '{ function f(x) { var y; }; }'), false)));
    assert.equal('', idsToString(variablesInBlock(parse(
        '{ var x = function f() {}; }'), false)));
    assert.equal('x', idsToString(variablesInBlock(parse(
        '{ let x = function f() {}; }'), false)));
    assert.equal('x', idsToString(variablesInBlock(parse(
        '{ let {x} = {x: 1}; }'), false)));
    assert.equal('x', idsToString(variablesInBlock(parse(
        '{ let {x = 1} = {} }'), false)));
    assert.equal('x', idsToString(variablesInBlock(parse(
        '{ let [x] = [1]; }'), false)));
    assert.equal('x', idsToString(variablesInBlock(parse(
        '{ let [x = 1] = []; }'), false)));
    assert.equal('x', idsToString(variablesInBlock(parse(
        '{ let [...x] = []; }'), false)));

    // Now set includeFunctionScope = true
    assert.equal('f', idsToString(variablesInBlock(parse(
        '{ function f(x) { var y; }; }'), true)));
    assert.equal('x', idsToString(variablesInBlock(parse(
        '{ var x = function f() {}; }'), true)));
  });

  test('BoundIdentifiersInFunction', function() {
    assert.equal('x,y', idsToString(variablesInFunction(parse(
        'function f(x) { var y; f(); }'))));
    assert.equal('g', idsToString(variablesInFunction(parse(
        'function f() { try { } catch (x) { function g(y) { } } }'))));
    assert.equal('', idsToString(variablesInFunction(parse(
        'function f() {\n' +
        '  "use strict";\n' +
        '  try {} catch (x) {\n' +
        '    function g(y) {}\n' +
        '  }\n' +
        '}'))));

    assert.equal('x,y', idsToString(variablesInFunction(parse(
        'function f({x}) { var y; f(); }'))));
    assert.equal('x,y,z', idsToString(variablesInFunction(parse(
        'function f({x, y}) { var z; f(); }'))));
    assert.equal('x,y,z', idsToString(variablesInFunction(parse(
        'function f({x}, {y}) { var z; f(); }'))));
    assert.equal('x,y,z', idsToString(variablesInFunction(parse(
        'function f([x, y]) { var z; f(); }'))));
    assert.equal('x,y,z', idsToString(variablesInFunction(parse(
        'function f([x, ...y]) { var z; f(); }'))));
  });

});
