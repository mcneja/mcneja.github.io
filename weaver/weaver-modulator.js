// Currently an elliptic low-pass biquad filter with sample rate = 48kHz, cutoff = 3kHz, ripple=0.1dB, SB-ripple=-30dB

const numBiquads = 3;

// elliptic, order 6, sample rate 48000, cutoff 1650, ripple 0.1, SB-ripple -30
const biquada=[0.9847334101796977,-1.9403053275004356,0.922685265188055,-1.8842185510441543,0.7808221000852114,-1.757210538668709];
const biquadb=[1,-1.9470510144634727,1,-1.9271643707815505,1,-1.6498595480616511];
const gain=33.850459546886015;

//const biquada = [0.8879685504942794,-1.7502961590787642,0.6193445968260233,-1.5384554383219655];
//const biquadb = [0.9999999999999999,-1.705778628324274,0.9999999999999999,-0.8926075796672571];
//const gain = 29.59612936071269;

//const biquada = [0.9681486219750995,-1.9578359999864536,0.8807467829532337,-1.8740700747937282];
//const biquadb = [1,-1.9780751982918687,0.9999999999999999,-1.8964502384213964];
//const gain = 33.33321849384001;

const wMin = 300;
const wMax = 3000;

const wOut = (wMin + wMax) / 2;

const sampleRate = 48000;

class LowPassFilter {
    constructor() {
        this.xyv = [0,0,0,0,0,0,0,0,0,0,0,0];
    }

    apply(v) {
        let xp = 0;
        let yp = 3;
        let bqp = 0;
        let out=v/gain;
        for (let i = 11; i > 0; i--) {
            this.xyv[i] = this.xyv[i-1];
        }
        for (let b = 0; b < numBiquads; b++) {
            let len = 2;
            this.xyv[xp] = out;
            for(let i = 0; i < len; i++) {
                out += this.xyv[xp+len-i]*biquadb[bqp+i] - this.xyv[yp+len-i]*biquada[bqp+i];
            }
            bqp += len;
            this.xyv[yp] = out;
            xp = yp;
            yp += len + 1;
        }
        return out;
    }
}

class ComplexOscillator {
    constructor() {
        this.u = 0;
        const angle = this.u * 2 * Math.PI;
        this.c = Math.cos(angle);
        this.s = Math.sin(angle);
    }

    advance(frequency, sampleRate) {
        const uIncrement = frequency / sampleRate;
        this.u += uIncrement;
        this.u -= Math.floor(this.u);
        const angle = this.u * 2 * Math.PI;
        this.c = Math.cos(angle);
        this.s = Math.sin(angle);
    }
}

class WeaverModulator extends AudioWorkletProcessor {
    constructor(options) {
        super(options);
        this.lowPassIn = new LowPassFilter();
        this.lowPass0 = new LowPassFilter();
        this.lowPass1 = new LowPassFilter();
        this.oscIn = new ComplexOscillator();
        this.oscOut = new ComplexOscillator();
    }

    static get parameterDescriptors() {
        return [
            { name: 'frequency', automationRate: 'a-rate', minValue: -6000, maxValue: 6000, defaultValue: 0 },
        ];
    }

    process(inputs, outputs, parameters) {
        if (inputs[0].length !== 1) {
            return false;
        }
        if (outputs[0].length !== 1) {
            return false;
        }

        const input = inputs[0][0];
        const output = outputs[0][0];
        const wInOffset = parameters['frequency'];

        for (let i = 0; i < input.length; ++i) {
            const v = input[i];
//            const v = this.lowPassIn.apply(input[i]);
            const x0 = this.oscIn.c * v;
            const x1 = this.oscIn.s * v;
            const y0 = this.lowPass0.apply(x0);
            const y1 = this.lowPass1.apply(x1);
            output[i] = this.oscOut.c * y0 + this.oscOut.s * y1;
            const wIn = wOut + (wInOffset.length > 1 ? wInOffset[i] : wInOffset[0]);
            this.oscIn.advance(wIn, sampleRate);
            this.oscOut.advance(wOut, sampleRate);
        }

        return true;
    }
}

registerProcessor('weaver-modulator', WeaverModulator);
