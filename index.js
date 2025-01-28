// Copyright (c)2025 Quinn Michaels
// The Socket Deva
import Deva from '@indra.ai/deva';
import Socket from 'socket.io';
import data from './data.json' with {type:'json'};
const {agent, vars} = data.DATA
import pkg from './package.json' with {type:'json'};

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
  copyright: pkg.copyright,
};
const SOCKET = new Deva({
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

    /**************
    func: error
    params: packet
    describe: Broadcast errors to the socket.
    ***************/
    'error'(packet) {
      if (!packet || !this._active) return;
      this.func.emit({say:'error', message:packet});
    },
  },
  modules: {
    server: require('http').createServer(),
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
        this.modules.socket.to(`client:${packet.q.client.id}`).emit('socket:client', packet);
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
  },
  methods: {},
  /**************
  func: onDone
  params: data
  describe: The onStart function sets up the necessary socket module for the deva
  and watches for disconnect and client:data events before joining a private
  socket..
  ***************/
  onInit(data) {
    this.modules.socket = Socket(this.modules.server, {
      cors: {
        origin: true,
        methods: ["GET", "POST"],
      }
    });
    this.modules.socket.on('connection', socket => {
      socket.join(`client:${data.client.id}`);
      socket.emit('socket:clientdata', data.client);
      socket.on('disconnect', () => {})
        // .on('client:data', data => {
        //   socket.join(data.id);
        // });
    });

    this.listen('devacore:prompt', packet => {
      this.func.emit(`${agent.key}:devacore`, packet);
    });
    this.listen('devacore:context', packet => {
      this.func.emit(`${agent.key}:devacore`, packet);
    });
    this.listen('devacore:state', packet => {
      this.func.emit(`${agent.key}:devacore`, packet);
    });
    this.listen('devacore:feature', packet => {
      this.func.emit(`${agent.key}:devacore`, packet);
    });
    this.listen('devacore:action', packet => {
      this.func.emit(`${agent.key}:devacore`, packet);
    });
    this.listen('devacore:zone', packet => {
      this.func.emit(`${agent.key}:devacore`, packet);
    });
    return this.start(data);
  },

  /**************
  func: onDone
  params: none
  describe: The onInit function sets the socket port and server information
  and prompts it to the user console before returning the this.start() function.
  ***************/
  onDone(data) {
    this.prompt(`port:${this.config.ports.socket}`);
    this.modules.server.listen(this.config.ports.socket);
    return Promise.resolve(data);
  },
});
export default SOCKET
