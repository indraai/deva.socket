"use strict";
// Copyright ©2025 Quinn A Michaels; All rights reserved. 
// Legal Signature Required For Lawful Use.
// Distributed under VLA:42145145912971709058 LICENSE.md

// SOCKET test file

const {expect} = require('chai')
const SocketDeva = require('./index.js');

describe(SocketDeva.me.name, () => {
  beforeEach(() => {
    return SocketDeva.init()
  });
  it('Check the SVARGA Object', () => {
    expect(SocketDeva).to.be.an('object');
    expect(SocketDeva).to.have.property('me');
    expect(SocketDeva).to.have.property('vars');
    expect(SocketDeva).to.have.property('listeners');
    expect(SocketDeva).to.have.property('methods');
    expect(SocketDeva).to.have.property('modules');
  });
})
