  import io from 'socket.io-client';

  /**
    * The Class Responsible for Talking with Polyglot-Node
    * @param {string} url - URL of NodeJS Server.
    */
  class WebSocket {
    constructor(url) {
      this.io = io(url);

      this.listen(() => {
        this.grabAudio();
      });
    }

    /**
     * Create socket.io event listeners.
     * @param {Function} cb  - Called once connected to server.
     */
    listen(cb) {
      this.io.on('disconnect', (err) => {
        console.error("Disconnected from Server.");
      })

    this.io.on('connect', (data) => {
      console.log("Connected to NodeJS Server");
      cb();
    });
    }
    /**
     * This Class Grabs the Audio from the User.
     * Line 48 needs to be replaced with the global variable for localstream found in Rails TODO: Put line
     * 
     * DEPRECAION WARNING. This method makes vital use of createScriptProcessor which will be scrapped at some point
     * in the future. TODO: Switch from createScriptProcessor to AudioWorklet (No documentation as of 2018-08-30)
     * @deprecated
     * @async
     */
    async grabAudio() {
      this.io.emit('startRecognition', "en-US", "fr");

      AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const processor = ctx.createScriptProcessor(2048, 1, 1);
      processor.connect(ctx.destination);
      processor.onaudioprocess = e => this.handleBuffer(e);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      ctx.createMediaStreamSource(stream).connect(processor);
      ctx.resume();
    }
    
    /**
     * Takes the Float32Array  Array from the ScriptProcessor Event
     * and converts it to Int16 for Google Speech to Text use.
     * @param {AudioProcessingEvent} e Chunk of Audio w/ Audio F32Array
     */
    handleBuffer(e) {
      let l = e.inputBuffer.getChannelData(0);
      this.io.emit('binary', convertF32ToI16(l));

      /**
       * 32Khz to 16Khz Audio
       * Converts Float32 Buffer to Int16Buffer
       * @param {Float32Array} buffer - Float32 Buffer;
       * @returns {ArrayBuffer}
       */
      function convertF32ToI16(buffer) {
        let l = buffer.length;
      
        let buf = new Int16Array(l / 3);
      
        while (l--) {
          if (l % 3 == 0) {
            buf[l / 3] = buffer[l] * 0xFFFF;
          }
        }
        return buf.buffer;
      }
    }
  }

  const ws = new WebSocket("http://localhost:1337");