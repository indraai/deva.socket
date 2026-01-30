"use strict";
// Socket Deva
// Copyright ©2000-2026 Quinn A Michaels; All rights reserved. 
// Legal Signature Required For Lawful Use.
// Distributed under VLA:68173929743679096434 LICENSE.md
// Friday, January 30, 2026 - 10:27:03 AM

// The Socket Deva
import Deva from '@indra.ai/deva';
import {createServer} from 'node:http';
import {Server} from 'socket.io';

import pkg from './package.json' with {type:'json'};
const {agent, vars} = pkg.data

// set the __dirname
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';    
const __dirname = dirname(fileURLToPath(import.meta.url));

const info = {
  id: pkg.id,
  name: pkg.name,
  describe: pkg.description,
  version: pkg.version,
  dir: __dirname,
  url: pkg.homepage,
  git: pkg.repository.url,
  bugs: pkg.bugs.url,
  author: pkg.author,
  license: pkg.license,
  VLA: pkg.VLA,
  copyright: pkg.copyright,
};
const SocketDeva = new Deva({
  info,
  agent,
  vars,
  utils: {
    translate(input) {return input.trim();},
    parse(input) {return input.trim();},
    process(input) {return input.trim();},
  },
  listeners: {
    /**************
    func: socket
    params: packet
    describe: Socket listener that sends the broadcast event to the available
    socket.
    ***************/
    'socket:global'(packet) {
      if (!packet || !this._active) return;
      this.func.emit('socket:global', packet).then(() => {
        this.talk(`socket:global:${packet.id}`, packet);
      });
    },

    /**************
    func: socket:terminal
    params: packet
    describe: pass a message to the socket terminal then talk a response when
    the socket broadcast is complete from the socketTreminal function.
    ***************/
    'socket:client'(packet) {
      if (!packet || !this._active) return;
      this.func.to(packet).then(result => {
        this.talk(`socket:client:${packet.id}`, true)
      });
    },

    /**************
    func: socket:event
    params: packet
    describe: pass a message to the socket event then talk a response when
    the socket broadcast is complete from the socketTreminal function.
    ***************/
    'socket:event'(packet) {
      if (!packet || !this._active) return;
      this.func.event(packet).then(result => {
        this.talk(`socket:event:${packet.id}`, true)
      });
    },
  },
  modules: {
    server: createServer(),
    socket: false,
  },
  sockets: {},
  deva: {},
  func: {
    /**************
    func: to
    params: packet
    describe: Send the packet information to the available socket terminal.
    ***************/
    to(packet) {
      // this is where we emit to the client socket oh yeah
      setImmediate(() => {
        this.modules.socket.to(`client:${packet.q.client.id.uid}`).emit('socket:client', packet);
      });
      // now we get the socket where the client id is.
      return Promise.resolve();
    },

    /**************
    func: emit
    params: opts - say & message
    describe: Emit a message to the say event
    ***************/
    emit(event, data) {
      this.modules.socket.emit(event, data);
      return Promise.resolve();
    },
    /**************
    func: event
    params: opts - say & message
    describe: send the value to a the key event
    ***************/
    event(opts) {
      this.modules.socket.emit(opts.event, opts);
      return Promise.resolve();
    },
    setupListeners() {
      this.listen('devacore:prompt', packet => {
        this.func.emit(`devacore:prompt`, packet);
      });
      this.listen('devacore:context', packet => {
        this.func.emit(`devacore:context`, packet);
      });
      this.listen('devacore:zone', packet => {
        this.func.emit(`devacore:zone`, packet);
      });
      this.listen('devacore:feature', packet => {
        this.func.emit(`devacore:feature`, packet);
      });
      this.listen('devacore:action', packet => {
        this.func.emit(`devacore:action`, packet);
      });
      this.listen('devacore:state', packet => {
        this.func.emit(`devacore:state`, packet);
      });
      this.listen('devacore:intent', packet => {
        this.func.emit(`devacore:intent`, packet);
      });
      this.listen('devacore:belief', packet => {
        this.func.emit(`devacore:intent`, packet);
      });
      this.listen('devacore:error', packet => {
        this.func.emit(`devacore:error`, packet);
      });
    },
    setupSocket() {
      const client = this.client();
      this.modules.socket = new Server(this.modules.server, {
        cors: {
          origin: true,
          methods: ["GET", "POST"],
        }
      });
      this.modules.socket.on('connection', socket => {
        socket.join(`client:${client.id.uid}`);
        socket.emit('socket:clientdata', client);
        socket.on('disconnect', () => {})
      });      
    }
  },
  methods: {},
  onInit(data, resolve) {
    const {personal} = this.license(); // get the license config
    const agent_license = this.info().VLA; // get agent license
    const license_check = this.license_check(personal, agent_license); // check license
    // return this.start if license_check passes otherwise stop.
    this.action('return', `onInit:${data.id.uid}`);
    return license_check ? this.start(data, resolve) : this.stop(data, resolve);
  },
  /**************
  func: onReady
  params: none
  describe: The onInit function sets the socket port and server information
  and prompts it to the user console before returning the this.start() function.
  ***************/
  onReady(data, resolve) {
    const {VLA} = this.info();
    this.func.setupSocket(); // setup the main socket connection
    this.func.setupListeners(); // setup the listeners function after socket setup
    
    this.modules.server.listen(this.config.ports.socket); // listen on the socket port
    this.prompt(`${this.vars.messages.ready} PORT:${this.config.ports.socket} > VLA:${VLA.uid}`);
    this.action('resolve', `onReady:${data.id.uid}`);
    return resolve(data);
  },
  onError(err, data, reject) {
    this.prompt(this.vars.messages.error);
    console.log('SocketDeva ERROR', err);
    return reject(err);
  }
});
export default SocketDeva
