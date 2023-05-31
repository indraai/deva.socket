// Copyright (c)2022 Quinn Michaels
// The Socket Deva

const fs = require('fs');
const path = require('path');
const package = require('./package.json');
const info = {
  id: package.id,
  name: package.name,
  describe: package.description,
  version: package.version,
  url: package.homepage,
  git: package.repository.url,
  bugs: package.bugs.url,
  author: package.author,
  license: package.license,
  copyright: package.copyright,
};

const data_path = path.join(__dirname, 'data.json');
const {agent,vars} = require(data_path).data;

const Socket = require('socket.io');

const Deva = require('@indra.ai/deva');
const SOCKET = new Deva({
  info,
  agent: {
    id: agent.id,
    key: agent.key,
    prompt: agent.prompt,
    voice: agent.voice,
    profile: agent.profile,
    translate(input) {
      return input.trim();
    },
    parse(input) {
      return input.trim();
    },
    process(input) {
      return input.trim();
    }
  },
  vars,
  listeners: {
    /**************
    func: socket
    params: packet
    describe: Socket listener that sends the broadcast event to the available
    socket.
    ***************/
    'socket:global'(packet) {
      if (!packet || !this.active) return;
      this.func.emit({say:packet.event, message:packet.data}).then(() => {
        this.talk(`${packet.event}:${packet.id}`, true);
      })
    },

    /**************
    func: socket:terminal
    params: packet
    describe: pass a message to the socket terminal then talk a response when
    the socket broadcast is complete from the socketTreminal function.
    ***************/
    'socket:client'(packet) {
      if (!packet || !this.active) return;
      this.func.socketClient(packet).then(result => {
        this.talk(`socket:client:${packet.id}`, true)
      }).catch(err => {
        this.talk('error', {err: err.toString('utf8')});
      });
    },

    /**************
    func: error
    params: packet
    describe: Broadcast errors to the socket.
    ***************/
    'error'(packet) {
      if (!packet || !this.active) return;
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
    func: socketClient
    params: packet
    describe: Send the packet information to the available socket terminal.
    ***************/
    socketClient(packet) {
      const client = this.client();
      // this is where we emit to the client socket oh yeah
      setImmediate(() => {
        this.modules.socket.to(client.id).emit('socket:client', packet);
      });
      // now we get the socket where the client id is.
      return Promise.resolve();
    },

    /**************
    func: systemEvent
    params:
      - event
      - packet
    describe: function used for broadcasating system evetnts.
    ***************/
    socketEmit(event, packet) {
      const client = this.client();
      setImmediate(() => {
        this.modules.socket.to(client.id).emit(event, packet);
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
  },
  methods: {
    client(packet) {
      return this.func.socketClient(packet)
    },
    /**************
    method: status
    params: packet
    describe: Return the socket deva status.
    ***************/
    status(packet) {
      return this.status();
    },

    /**************
    method: help
    params: packet
    describe: Return the Socket Deva help.
    ***************/
    help(packet) {
      return new Promise((resolve, reject) => {
        this.lib.help(packet.q.text, __dirname).then(help => {
          return this.question(`#feecting parse ${help}`);
        }).then(parsed => {
          return resolve({
            text: parsed.a.text,
            html: parsed.a.html,
            data: parsed.a.data,
          });
        }).catch(reject);
      });
    },
  },

  /**************
  func: onDone
  params: data
  describe: The onStart function sets up the necessary socket module for the deva
  and watches for disconnect and client:data events before joining a private
  socket..
  ***************/
  onDone(data) {
    const client = this.client();
    this.prompt(this.vars.messages.config);
    this.modules.socket = Socket(this.modules.server, {
      cors: {
        origin: true,
        methods: ["GET", "POST"],
      }
    });
    this.modules.socket.on('connection', socket => {
      socket.join(client.id);
      socket.emit('socket:clientdata', client);
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
    return Promise.resolve(data);
  },

  /**************
  func: onInit
  params: none
  describe: The onInit function sets the socket port and server information
  and prompts it to the user console before returning the this.start() function.
  ***************/
  onInit(data) {
    this.prompt(`${this.vars.messages.init} port:${this.config.ports.socket}`);
    this.modules.server.listen(this.config.ports.socket);
    return this.start(data);
  },
});
module.exports = SOCKET
