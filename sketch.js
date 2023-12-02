let EmuSettings = {
  USEROMFILE: true,
  clockMulti: 20, //only allows integer

  // customizable colors
  bg: "#2F1F1F",
  fg: "#FFDFDF",
};

let CPU;
let ROMDATA;
let lastKey;
let bringOver = false;
let ROM;
let ITF = 0;

var CorruptFB;

var ClockSpeed;
var DispWait;

let pause = false;

// IMPLEMENTED INSTRUCTIONS
// 0NNN	Unused in Modern Interpreters.
// 00E0	Clear the screen
// 00EE	Return from a subroutine
// 1NNN	Jump to address NNN
// 2NNN	Execute subroutine starting at address NNN
// 3XNN	Skip the following instruction if the value of register VX equals NN
// 4XNN	Skip the following instruction if the value of register VX is not equal to NN
// 5XY0	Skip the following instruction if the value of register VX is equal to the value of register VY
// 6XNN	Store number NN in register VX
// 7XNN	Add the value NN to register VX
// 8XY0	Store the value of register VY in register VX
// 8XY1	Set VX to VX OR VY
// 8XY2	Set VX to VX AND VY
// 8XY3	Set VX to VX XOR VY
// 8XY4	Add the value of register VY to register VX. Set VF to 01 if a carry occurs. Set VF to 00 if a carry does not occur
// 8XY5	Subtract the value of register VY from register VX. Set VF to 00 if a borrow occurs. Set VF to 01 if a borrow does not occur
// 8XY6	Store the value of register VY shifted right one bit in register VX. Set register VF to the least significant bit prior to the shift. VY is unchanged
// 8XY7	Set register VX to the value of VY minus VX. Set VF to 00 if a borrow occurs. Set VF to 01 if a borrow does not occur
// 8XYE	Store the value of register VY shifted left one bit in register VX. Set register VF to the most significant bit prior to the shift. VY is unchanged
// 9XY0	Skip the following instruction if the value of register VX is not equal to the value of register VY
// ANNN	Store memory address NNN in register I
// BNNN	Jump to address NNN + V0
// CXNN	Set VX to a random number with a mask of NN
// DXYN	Draw a sprite at position VX, VY with N bytes of sprite data starting at the address stored in I. Set VF to 01 if any set pixels are changed to unset, and 00 otherwise
// EX9E	Skip the following instruction if the key corresponding to the hex value currently stored in register VX is pressed
// EXA1	Skip the following instruction if the key corresponding to the hex value currently stored in register VX is not pressed
// FX07	Store the current value of the delay timer in register VX
// FX0A	Wait for a keypress and store the result in register VX
// FX15	Set the delay timer to the value of register VX
// FX18	Set the sound timer (aka. sound timer 1) to the value of register VX
// FX1E	Add the value stored in register VX to register I
// FX29	Set I to the memory address of the sprite data corresponding to the hexadecimal digit stored in register VX
// FX33	Store the binary-coded decimal equivalent of the value stored in register VX at addresses I, I + 1, and I + 2
// FX55	Store the values of registers V0 to VX inclusive in memory starting at address I. I is set to I + X + 1 after operation
// FX65	Fill registers V0 to VX inclusive with the values stored in memory starting at address I. I is set to I + X + 1 after operation

// CUSTOM INSTRUCTIONS
// FXA0 Set sound timer 2 to the value of register VX.
// FXA1 Set sound timer 3 to the value of register VX.
// FXA2 Set sound timer 4 to the value of register VX.
// FXB0 Set the frequency of Osc 1 to the value of register VX.
// FXB1 Set the frequency of Osc 2 to the value of register VX.
// FXB2 Set the frequency of Osc 3 to the value of register VX.
// FXB3 Set the frequency of Osc 4 to the value of register VX.
// FXC0 Set the volume of Osc 1 to the value of register VX.
// FXC1 Set the volume of Osc 2 to the value of register VX.
// FXC2 Set the volume of Osc 3 to the value of register VX.
// FXC3 Set the volume of Osc 4 to the value of register VX.
// FXD0 Set the type of Osc that Osc 1 uses to the value of register VX.
// FXD1 Set the type of Osc that Osc 2 uses to the value of register VX.
// FXD2 Set the type of Osc that Osc 3 uses to the value of register VX.
// FXD3 Set the type of Osc that Osc 4 uses to the value of register VX.
// FXE0 Set the vibrato multiplier for Osc 1.
// FXE1 Set the vibrato multiplier for Osc 2.
// FXE2 Set the vibrato multiplier for Osc 3.
// FXE3 Set the vibrato multiplier for Osc 4xrft.
// FNNF Subtract NN from the Program Counter. (MAX of 255 instructions)

let font = [
  0x60,
  0xD0,
  0xD0,
  0xD0,
  0x60, // 0
  0x60,
  0xE0,
  0x60,
  0x60,
  0xF0, // 1
  0xF0,
  0x30,
  0xF0,
  0xC0,
  0xF0, // 2
  0xE0,
  0x30,
  0xE0,
  0x30,
  0xE0, // 3
  0xB0,
  0xB0,
  0xF0,
  0x30,
  0x30, // 4
  0xF0,
  0xC0,
  0xF0,
  0x30,
  0xF0, // 5
  0x70,
  0xC0,
  0xF0,
  0xD0,
  0x60, // 6
  0xf0,
  0x30,
  0x60,
  0xC0,
  0xC0, // 7
  0x60,
  0xB0,
  0x60,
  0xB0,
  0x60, // 8
  0x60,
  0xD0,
  0xF0,
  0x30,
  0x60, // 9
  0xF0,
  0xD0,
  0xF0,
  0xD0,
  0xD0, // A
  0xE0,
  0xD0,
  0xE0,
  0xD0,
  0xE0, // B
  0x70,
  0xC0,
  0xC0,
  0xC0,
  0x70, // C
  0xE0,
  0xD0,
  0xD0,
  0xD0,
  0xE0, // D
  0xF0,
  0xC0,
  0xF0,
  0xC0,
  0xF0, // E
  0xF0,
  0xC0,
  0xF0,
  0xC0,
  0xC0, // F
  0xc0,
  0xc6,
  0xc0,
  0xf6,
  0xde,
  0xde,
  0xf6, //BI
  0x00,
  0x00,
  0x00,
  0x73,
  0xde,
  0xdb,
  0x76, //OS
  0x96,
  0xd9,
  0xb9,
  0x99,
  0x96, //NO
  0xe6,
  0x99,
  0x99,
  0xe9,
  0x96, //RO
  0xd2,
  0xaa,
  0xaa,
  0x88,
  0x8a, //M!
  0x06,
  0x0e,
  0x06,
  0xe6,
  0xd6,
  0xc6,
  0xcf, //R1
];

let program = [
  // program here!
  0x60, 0x05,
  0x30, 0x05,
  0xA0, 0x00,
  0x30, 0x05,
  0x12, 0x0C,
  0x12, 0x1E,
  0x6D, 0x20,
  0x6E, 0x10,
  0xDD, 0xE5,
  0xA0, 0x46,
  0x6D, 0x1B,
  0x6E, 0x10,
  0xDD, 0xE5,
  0x12, 0x1A,
  0x40, 0x00,
  0xA0, 0x05,
  0x40, 0x00,
  0x12, 0x0C,
];

let bios = [
  0x61, 0x19, 
  0xa0, 0x50, 
  0xd0, 0x17, 
  0x60, 0x07, 
  0xa0, 0x57, 
  0xd0, 0x17, 
  0x60, 0x12, 
  0x61, 0x19, 
  0xa0, 0x6d, 
  0xd0, 0x17, 
  0x61, 0x0c, 
  0xa0, 0x5e, 
  0x60, 0x12, 
  0xd0, 0x15, 
  0x70, 0x0c, 
  0xa0, 0x63, 
  0xd0, 0x15, 
  0x70, 0x08, 
  0xa0, 0x68, 
  0xd0, 0x15, 
  0x62, 0x30, 
  0xf2, 0x15, 
  0xf3, 0x07, 
  0x33, 0x00, 
  0xf0, 0x3f, 
  0x12, 0x14,
];

let keys = [
  "x",
  "1",
  "2",
  "3",
  "q",
  "w",
  "e",
  "a",
  "s",
  "d",
  "z",
  "c",
  "4",
  "r",
  "f",
  "v",
];

class VM {
  constructor() {
    this.framebuffer = new Uint8Array(2096);
    this.memory = new Uint16Array(4098);
    this.registers = new Uint8Array(16);
    this.stack = new Uint16Array(16);
    this.PC = 0x200;
    this.SP = 0;
    this.I = 80;
    this.dtimer = 0;
    this.OSC = [];
    this.stimer = [0, 0, 0, 0];
    this.freq = [440, 440, 440, 440];
    this.sType = [0, 0, 0, 0];
    this.volume = [1, 1, 1, 1];
    this.vibMulti = [0, 0, 0, 0];
  }
}

function loadROM(file) {
  //console.log(file,file.name);
  ROMDATA = loadBytes(file.data, function callback() {
    CPU.PC = 0x200;
    CPU.framebuffer = new Uint8Array(2096);
    CPU.memory = new Uint16Array(4098);
    CPU.registers = new Uint8Array(16);
    CPU.stack = new Uint16Array(16);
    CPU.PC = 0x200;
    CPU.SP = 0;
    CPU.I = 80;
    CPU.stimer = [0, 0, 0, 0];
    CPU.freq = [440, 440, 440, 440];
    CPU.sType = [0, 0, 0, 0];
    CPU.volume = [1, 1, 1, 1];
    CPU.vibMulti = [0, 0, 0, 0];

    // reload Font
    for (let i = 0; i <= font.length; i++) {
      CPU.memory[i] = font[i];
    }

    // reload ROM
    for (let i = 0x200; i - 0x200 < ROMDATA.bytes.length; i += 2) {
      CPU.memory[i] = ROMDATA.bytes[i - 0x200];
      CPU.memory[i + 1] = ROMDATA.bytes[i - 0x200 + 1];
    }
  });
  //console.log(ROMDATA);
}

function corrupt(type) {
  if (type == "framebuffer") {
    for (let i = 0; i < 200; i++) {
      CPU.framebuffer[round(random(0, 2079))] = round(random(0, 1));
    }
    refreshScreen();
  }
}

function setup() {
  //console.clear();

  ROM = createFileInput(loadROM);

  createCanvas(64 * (windowWidth / 64), 32 * (windowWidth / 64));
  background(EmuSettings.bg);
  noSmooth();
  frameRate(60);
  CPU = new VM();

  // setup Oscillators
  CPU.OSC = [
    new p5.Oscillator("square"),
    new p5.Oscillator("square"),
    new p5.Oscillator("triangle"),
    new p5.Noise("white"),
  ];

  for (let i = 0; i < CPU.OSC.length; i++) {
    CPU.OSC[i].start();
    CPU.OSC[i].amp(0, 0);
  }

  // put font in mem
  for (let i = 0; i <= font.length; i++) {
    CPU.memory[i] = font[i];
  }

  // put ROM in mem
  if (EmuSettings.USEROMFILE) {
    // checks if it has to convert a ch8 file or use the built in programmable array "program".
    for (let i = 0x200; i - 0x200 < bios.length; i += 2) {
      CPU.memory[i] = bios[i - 0x200];
      CPU.memory[i + 1] = bios[i - 0x200 + 1];
    }
  } else {
    for (let i = 0x200; i - 0x200 <= program.length; i++) {
      CPU.memory[i] = program[i - 0x200];
    }
  }

  // config during emulation
  ClockSpeed = createSlider(10, 100, EmuSettings.clockMulti, 5);
  ClockSpeed.style("width", "150px");

  CorruptFB = createButton("Corrupt Frame Buffer");
  CorruptFB.mousePressed(() => {
    corrupt("framebuffer");
  });

  DispWait = createCheckbox("Wait for VBlank", false);

  ////console.log(CPU.memory);
  ////console.log(ROMDATA.bytes);
  //noLoop();
}

// fetch decode execute loop
function draw() {
  EmuSettings.clockMulti = ClockSpeed.value();

  if (bringOver == true) {
    key = lastKey;
    bringOver = false;
  }

  ITF = 0;

  for (let i = 0; i < EmuSettings.clockMulti; i++) {
    let inst = Fetch();
    let decoded = Decode(inst);
    let execreturn;
    if (decoded[0] != "SKIPUNSUPPORTED")execreturn = Execute(decoded[0], decoded[1], decoded[2], decoded[3]);

    if(execreturn=="BRKCYCLE")break;

    ITF++;

    //console.log("PC: "+CPU.PC+" - Instruction (HEX): "+hex(inst,4)+" - Decoded Instruction: "+decoded[0]+" - Full Instruction: "+decoded+" - DT: "+CPU.dtimer+" - ST: "+CPU.stimer);
  }

  noSmooth();
  refreshScreen();

  var colr = color(0);
  stroke(colr);
  colr.setAlpha(50);
  stroke(colr);
  
  for (var x = 0; x < width; x += width/64){
    line(x, 0, x, height);	
  }
  for (var y = 0; y < height; y += 1) {
    colr.setAlpha((y%(width/64))*3);
    stroke(colr)
    line(0, y, width, y);
  }
  
  var colr = color(0, 0, 0);
  colr.setAlpha(125);
  fill(colr);
  rect(0, 0, 155, 30);
  fill("white");
  text("Framerate: " + round(frameRate() * 10) / 10, 0, 10);
  text("Instructions Per Frame: " + EmuSettings.clockMulti, 0, 20);

  if (CPU.dtimer > 0) CPU.dtimer -= 1;
  for (let o = 0; o < CPU.stimer.length; o++) {
    if (CPU.stimer[o] > 0) {
      text(o, o * 7, 30);
      if(o!=3){
        CPU.OSC[o].freq(CPU.freq[o] + sin(frameCount / 2) * (CPU.vibMulti[o] * 4));
        if (CPU.sType[o] == 0) CPU.OSC[o].setType(p5.SqrOsc);
        if (CPU.sType[o] == 1) CPU.OSC[o].setType(p5.SawOsc);
        if (CPU.sType[o] == 2) CPU.OSC[o].setType(p5.SinOsc);
        if (CPU.sType[o] == 3) CPU.OSC[o].setType(p5.TriOsc);
      }
      CPU.OSC[o].amp(CPU.volume[0] / (10 - o), 0);
      CPU.stimer[o] -= 1;
    } else {
      CPU.OSC[o].amp(0, 0);
    }
  }

  if (keyIsPressed == true) {
    lastKey = key;
    bringOver = true;
  }
  key = undefined;
}

//resizes canvas on window resize
function windowResized() {
  resizeCanvas(64 * (windowWidth / 64), 32 * (windowWidth / 64));
  refreshScreen();
}

// makes sure when the user interacts it actually starts the audio
function mousePressed() {
  userStartAudio();
}



// computing calls
function Fetch() {
  let a = CPU.memory[CPU.PC]*0x100;
  let b = CPU.memory[CPU.PC + 1];
  let inst = a + b;
  if (CPU.PC > CPU.memory.length) {
    console.error(
      "ERR - PROGRAM COUNTER OVERFLOW - OCCURED AT ADDRESS 0x" +
        hex(CPU.PC, 3) +
        "/" +
        CPU.PC,
    );
    noLoop();
  } else if (isNaN(a) & isNaN(b)) {
    console.error(
      "ERR - INSTRUCTION RETURNED NAN - OCCURED AT ADDRESS 0x" +
        hex(CPU.PC, 3) +
        "/" +
        CPU.PC,
    );
    noLoop();
  }

  CPU.PC += 2; // increment PC by 2 before returning the decoded instruction.
  return inst;
}

function Decode(inst) {
  let combined = inst & 0x0FFF;
  let combined2 = inst & 0x00FF;
  let r1 = CPU.registers[(inst&0x0F00)/0x0100];
  let r2 = CPU.registers[(inst&0x00F0)/0x0010];
  switch (floor(inst/0x1000)) {
    case 0x0:
      if (combined2 == 0x00E0) return ["CLS"];
      if (combined2 == 0x00EE) return ["RET"];
      return ["BRK"];

    case 0x1:
      return ["JP", combined];

    case 0x2:
      return ["CALL", combined];

    case 0x3:
      if (r1 == combined2) {
        return ["SKIP"];
      } else {
        return ["CONT"];
      }
      break;

    case 0x4:
      if (r1 != combined2) {
        return ["SKIP"];
      } else {
        return ["CONT"];
      }
      break;

    case 0x5:
      if (r1 == r2) {
        return ["SKIP"];
      } else {
        return ["CONT"];
      }
      break;

    case 0x6:
      return ["LDNX", (inst&0x0F00)/0x0100, combined2];

    case 0x7:
      return ["ADD", (inst&0x0F00)/0x0100, combined2];

    case 0x8:
      if ((inst&0x000F)==0x0000) return ["8LDNX", (inst&0x0F00)/0x0100, (inst&0x00F0)/0x0010];
      if ((inst&0x000F)==0x0001) return ["VXORVY", (inst&0x0F00)/0x0100, (inst&0x00F0)/0x0010];
      if ((inst&0x000F)==0x0002) return ["VXANDVY", (inst&0x0F00)/0x0100, (inst&0x00F0)/0x0010];
      if ((inst&0x000F)==0x0003) return ["VXXORVY", (inst&0x0F00)/0x0100, (inst&0x00F0)/0x0010];
      if ((inst&0x000F)==0x0004) return ["ADDWC", (inst&0x0F00)/0x0100, (inst&0x00F0)/0x0010];
      if ((inst&0x000F)==0x0005) return ["SUBWC", (inst&0x0F00)/0x0100, (inst&0x00F0)/0x0010];
      if ((inst&0x000F)==0x0006) return ["SHIFTR", (inst&0x0F00)/0x0100, (inst&0x00F0)/0x0010];
      if ((inst&0x000F)==0x0007) return ["SUBWC2", (inst&0x0F00)/0x0100, (inst&0x00F0)/0x0010];
      if ((inst&0x000F)==0x000E) return ["SHIFTL", (inst&0x0F00)/0x0100, (inst&0x00F0)/0x0010];
      //console.log("unsupported instruction",inst);
      return ["SKIPUNSUPPORTED"];

    case 0x9:
      if (r1 != r2) {
        return ["SKIP"];
      } else {
        return ["CONT"];
      }
      break;

    case 0xA:
      return ["LDI", combined];

    case 0xB:
      return ["JP", combined + CPU.registers[0]];

    case 0xC:
      return ["RAND", (inst&0x0F00)/0x0100, combined2];

    case 0xD:
      return ["DRW", (inst&0x0F00)/0x0100, (inst&0x00F0)/0x0010, (inst&0x000F)];

    case 0xE:
      if (combined2 == 0x009E) return ["SKIPPRESSED", (inst&0x0F00)/0x0100];
      if (combined2 == 0x00A1) return ["SKIPNOTPRESSED", (inst&0x0F00)/0x0100];
      //console.log("unsupported instruction",inst);
      return ["SKIPUNSUPPORTED"];

    case 0xF:
      if (combined2 == 0x0007) return ["LDVXDT", (inst&0x0F00)/0x0100];
      if (combined2 == 0x000A) return ["WAITKEY", (inst&0x0F00)/0x0100];
      if (combined2 == 0x0015) return ["LDDTVX", (inst&0x0F00)/0x0100];
      if (combined2 == 0x0018) return ["LDSTVX", (inst&0x0F00)/0x0100];
      if (combined2 == 0x001E) return ["ADDI", (inst&0x0F00)/0x0100];
      if (combined2 == 0x0029) return ["LDITOADVX", (inst&0x0F00)/0x0100];
      if (combined2 == 0x0033) return ["BCD", (inst&0x0F00)/0x0100];
      if (combined2 == 0x0055) return ["STOREVATI", (inst&0x0F00)/0x0100];
      if (combined2 == 0x0065) return ["STOREIATV", (inst&0x0F00)/0x0100];
      if (combined2 == 0x00A0) return ["LDST2VX", (inst&0x0F00)/0x0100];
      if (combined2 == 0x00A1) return ["LDST3VX", (inst&0x0F00)/0x0100];
      if (combined2 == 0x00A1) return ["LDST4VX", (inst&0x0F00)/0x0100];
      if (combined2 == 0x00B0) return ["FREQ1", (inst&0x0F00)/0x0100];
      if (combined2 == 0x00B1) return ["FREQ2", (inst&0x0F00)/0x0100];
      if (combined2 == 0x00B2) return ["FREQ3", (inst&0x0F00)/0x0100];
      if (combined2 == 0x00B3) return ["FREQ4", (inst&0x0F00)/0x0100];
      if (inst & 0x000F == 0x000F) return ["SUBPC", (inst&0x0F00)/0x0100 + (inst&0x00F0)/0x0010];
      //console.log("unsupported instruction",inst);
      return ["SKIPUNSUPPORTED"];

    default:
      //console.log("unsupported instruction",inst);
      return ["SKIPUNSUPPORTED"];
  }
}

function Execute(decoded, val1, val2, val3) {
  switch (decoded) {
    case "CLS":
      CPU.framebuffer = new Uint8Array(2079);
      break;

    case "RET":
      CPU.PC = CPU.stack[CPU.SP];
      //console.log("PC was set to: "+CPU.PC+". Equal to the stack: "+String(CPU.PC==CPU.stack[CPU.SP])+" - SP: "+CPU.SP);
      CPU.SP -= 1;
      break;

    case "BRK":
      CPU.PC -= 2;
      break;

    case "JP":
      CPU.PC = val1;
      break;

    case "SUBPC":
      CPU.PC -= val1 * 2;
      break;

    case "CALL":
      CPU.SP++;
      if (CPU.SP > 15) {
        CPU.SP = 15;
      }
      //console.log("Current PC: "+CPU.PC);
      CPU.stack[CPU.SP] = CPU.PC;
      //console.log("CPU.SP: "+CPU.SP);
      //console.log("STACK ADDRESS SET TO: "+CPU.PC);
      CPU.PC = val1;
      break;

    case "SKIP":
      CPU.PC += 2;
      break;

    case "CONT":
      // here so the handler doesn't say "UNSUPPORTED" :)
      break;

    case "LDNX":
      CPU.registers[val1] = val2;
      break;

    case "ADD":
      CPU.registers[val1] += val2;
      break;

    case "VXORVY":
      CPU.registers[val1] =
        CPU.registers[val1] | CPU.registers[val2];
      CPU.registers[15] = 0;
      break;

    case "8LDNX":
      CPU.registers[val1] = CPU.registers[val2];
      break;

    case "VXANDVY":
      CPU.registers[val1] =
        CPU.registers[val1] & CPU.registers[val2];
      CPU.registers[15] = 0;
      break;

    case "VXXORVY":
      CPU.registers[val1] =
        CPU.registers[val1] ^ CPU.registers[val2];
      CPU.registers[15] = 0;
      break;

    case "ADDWC":
      let VX = CPU.registers[val1] + CPU.registers[val2];
      CPU.registers[val1] = VX;
      if (VX > 255) {
        CPU.registers[15] = 1;
      } else {
        CPU.registers[15] = 0;
      }
      break;

    case "SUBWC":
      let VX2 = CPU.registers[val1] - CPU.registers[val2];
      CPU.registers[val1] = VX2;
      if (VX2 < 0) {
        CPU.registers[15] = 0;
      } else {
        CPU.registers[15] = 1;
      }
      break;

    case "SHIFTR":
      let least = CPU.registers[val2] & 0x1;
      CPU.registers[val1] = CPU.registers[val2] >> 1;
      CPU.registers[15] = least;
      break;

    case "SUBWC2":
      let VX4 = CPU.registers[val2] - CPU.registers[val1];
      CPU.registers[val1] = VX4;
      if (VX4 < 0) {
        CPU.registers[15] = 0;
      } else {
        CPU.registers[15] = 1;
      }
      break;

    case "SHIFTL":
      let greatest = CPU.registers[val2] >> 7;
      CPU.registers[val1] = CPU.registers[val2] << 1;
      CPU.registers[15] = greatest;
      break;

    case "LDI":
      CPU.I = val1;
      break;

    case "RAND":
      let RandNum = int(random(255));
      CPU.registers[val1] = RandNum & val2;
      break;

    case "DRW":
      if (ITF > 0 && DispWait.checked()) {
        CPU.PC -= 2;
        return "BRKCYCLE";
      }

      let r1 = CPU.registers[val1];
      let r2 = CPU.registers[val2];
      let height = val3;
      if (height < 0 || height > 15) {
        //console.error("INVALID HEIGHT ON DRAW INSTRUCTION AT PC 0x"+hex(CPU.PC-2,3));
        break;
      }
      let gfxData = [];
      for (let i = 0; gfxData.length < height; i++) {
        let unhexed = CPU.memory[CPU.I + i].toString(2);
        for (let p = 0; unhexed.length < 8; p++) {
          unhexed = "0" + unhexed;
        }
        append(gfxData, unhexed);
      }
      //console.log("GFX: ",gfxData);

      let amt = 0;

      for (let i = r2 % 32; i < height + (r2 % 32); i++) {
        let row = gfxData[i - (r2 % 32)];
        for (let o = r1 % 64; o < 8 + (r1 % 64); o++) {
          let letter = row[o - (r1 % 64)];
          if (letter == "1") {
            if (CPU.framebuffer[o + i * 65] == 1) amt++;
            CPU.framebuffer[o + i * 65] ^= 1;
          }
        }
      }

      if (amt > 0) {
        CPU.registers[15] = 1;
      } else {
        CPU.registers[15] = 0;
      }

      break;

    case "SKIPPRESSED":
      if (key == undefined) {
        break;
      }
      //console.log("SKIPPRESSED register asked: "+unhex(val1+" - register value: "+CPU.registers[unhex(val1]+" - Index of Key: "+keys.indexOf(key));
      if (CPU.registers[val1 & 0xf] == keys.indexOf(key)) CPU.PC += 2;
      break;

    case "SKIPNOTPRESSED":
      if (key == undefined) {
        CPU.PC += 2;
        break;
      }
      //console.log("SKIPNOTPRESSED - register asked: "+unhex(val1+" - register value: "+CPU.registers[unhex(val1]+" - Index of Key: "+keys.indexOf(key));
      if (CPU.registers[val1 & 0xf] != keys.indexOf(key)) {
        CPU.PC += 2;
      }
      break;

    case "LDVXDT":
      CPU.registers[val1] = CPU.dtimer;
      break;

    case "WAITKEY":
      if (key == undefined) {
        CPU.PC -= 2;
        break;
      }
      CPU.registers[val1] = keys.indexOf(key);
      break;

    case "LDDTVX":
      CPU.dtimer = CPU.registers[val1];
      break;

    case "LDSTVX":
      CPU.stimer[0] = CPU.registers[val1];
      break;

    case "LDST2VX":
      CPU.stimer[1] = CPU.registers[val1];
      break;

    case "LDST3VX":
      CPU.stimer[2] = CPU.registers[val1];
      break;

    case "LDST4VX":
      CPU.stimer[3] = CPU.registers[val1];
      break;

    case "FREQ1":
      CPU.freq[0] = CPU.registers[val1] * 5;
      break;

    case "FREQ2":
      CPU.freq[1] = CPU.registers[val1] * 5;
      break;

    case "FREQ3":
      CPU.freq[2] = CPU.registers[val1] * 5;
      break;

    case "FREQ4":
      CPU.freq[3] = CPU.registers[val1] * 5;
      break;

    case "ADDI":
      CPU.I += CPU.registers[val1];
      break;

    case "LDITOADVX":
      CPU.I = 5 * (CPU.registers[val1] & 0xf);
      break;

    case "BCD":
      let VX3 = String(CPU.registers[val1]);
      while (VX3.length < 3) {
        VX3 = "0" + VX3;
      }
      CPU.memory[CPU.I & 0xFFF] = int(VX3[0]);
      CPU.memory[(CPU.I + 1) & 0xFFF] = int(VX3[1]);
      CPU.memory[(CPU.I + 2) & 0xFFF] = int(VX3[2]);
      break;

    case "STOREVATI":
      for (let i = 0; i <= val1; i++) {
        CPU.memory[(i + CPU.I) & 0xfff] = CPU.registers[i];
      }
      CPU.I += (val1 + 1) & 0xfff;
      break;

    case "STOREIATV":
      for (let i = 0; i <= val1; i++) {
        CPU.registers[i] = CPU.memory[(i + CPU.I) & 0xfff];
      }
      CPU.I += (val1 + 1) & 0xfff;
      break;

    default:
      //console.error("INSTRUCTION: "+decoded+" DOES NOT EXIST.")
      noLoop();
      break;
  }
}

function refreshScreen() {
  let graphics = createGraphics(64, 32);
  background(EmuSettings.bg);
  graphics.noStroke();
  graphics.fill(EmuSettings.fg);
  let x = 0;
  let y = 0;
  for (let i = 0; i < CPU.framebuffer.length; i++) {
    if (CPU.framebuffer[i] == 1) {
      graphics.rect(x, y, 1, 1);
    }
    x++;
    if (x > 64) {
      x = 0;
      y++;
    }
  }
  image(graphics, 0, 0, width, height);
}