function e(e,t,n,o){Object.defineProperty(e,t,{get:n,set:o,enumerable:!0,configurable:!0})}var t="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{},n={},o={},r=t.parcelRequire280e;let i;var a;let s;var c;null==r&&((r=function(e){if(e in n)return n[e].exports;if(e in o){var t=o[e];delete o[e];var r={id:e,exports:{}};return n[e]=r,t.call(r.exports,r,r.exports),r.exports}var i=new Error("Cannot find module '"+e+"'");throw i.code="MODULE_NOT_FOUND",i}).register=function(e,t){o[e]=t},t.parcelRequire280e=r),r.register("27Lyk",(function(t,n){var o,r;e(t.exports,"register",(()=>o),(e=>o=e)),e(t.exports,"resolve",(()=>r),(e=>r=e));var i={};o=function(e){for(var t=Object.keys(e),n=0;n<t.length;n++)i[t[n]]=e[t[n]]},r=function(e){var t=i[e];if(null==t)throw new Error("Could not resolve bundle with id "+e);return t}})),r("27Lyk").register(JSON.parse('{"17fSe":"index.43600d6c.js","8FZzo":"font.d94e27b4.png"}')),(a=i||(i={})).create=function(){return[0,0]},a.clone=function(e){return[e[0],e[1]]},a.fromValues=function(e,t){return[e,t]},a.copy=function(e,t){e[0]=t[0],e[1]=t[1]},a.set=function(e,t,n){e[0]=t,e[1]=n},a.add=function(e,t,n){e[0]=t[0]+n[0],e[1]=t[1]+n[1]},a.subtract=function(e,t,n){e[0]=t[0]-n[0],e[1]=t[1]-n[1]},a.multiply=function(e,t,n){e[0]=t[0]*n[0],e[1]=t[1]*n[1]},a.scale=function(e,t,n){e[0]=t[0]*n,e[1]=t[1]*n},a.scaleAndAdd=function(e,t,n,o){e[0]=t[0]+n[0]*o,e[1]=t[1]+n[1]*o},a.distance=function(e,t){const n=e[0]-t[0],o=e[1]-t[1];return Math.hypot(n,o)},a.squaredDistance=function(e,t){const n=e[0]-t[0],o=e[1]-t[1];return n*n+o*o},a.length=function(e){return Math.hypot(e[0],e[1])},a.squaredLength=function(e){const t=e[0],n=e[1];return t*t+n*n},a.negate=function(e,t){e[0]=-t[0],e[1]=-t[1]},a.dot=function(e,t){return e[0]*t[0]+e[1]*t[1]},a.lerp=function(e,t,n,o){e[0]=t[0]+o*(n[0]-t[0]),e[1]=t[1]+o*(n[1]-t[1])},a.zero=function(e){e[0]=0,e[1]=0},(c=s||(s={})).create=function(){return[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},c.copy=function(e,t){e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]},c.ortho=function(e,t,n,o,r,i,a){const s=1/(t-n),c=1/(o-r),d=1/(i-a);e[0]=-2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=-2*c,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=2*d,e[11]=0,e[12]=(t+n)*s,e[13]=(r+o)*c,e[14]=(a+i)*d,e[15]=1};var d;d=new URL(r("27Lyk").resolve("8FZzo"),import.meta.url).toString(),window.onload=function(){!function(e,t){const n=new Image;n.onload=()=>{t(n)},n.onerror=t=>{console.log(`Error loading Image ${e}`),console.log(t)},n.src=e}(d,(e=>{!function(e){const t=document.querySelector("#canvas"),n=t.getContext("webgl2",{alpha:!1,depth:!1});if(null==n)return void alert("Unable to initialize WebGL2. Your browser or machine may not support it.");const o=function(e,t){const n=function(e,t){const n=16,o=16,r=n*o,i=t.naturalWidth/n,a=t.naturalHeight/o,s=4,c=i*s,d=a*s,l=document.createElement("canvas");l.width=c,l.height=d*r;const f=l.getContext("2d");f.imageSmoothingEnabled=!1;for(let e=0;e<o;++e)for(let o=0;o<n;++o){const r=o*i,s=e*a,l=0,u=(n*e+o)*d;f.drawImage(t,r,s,i,a,l,u,c,d)}const u=f.getImageData(0,0,l.width,l.height),h=new Uint8Array(u.data.buffer),p=e.createTexture();return e.bindTexture(e.TEXTURE_2D_ARRAY,p),e.texParameteri(e.TEXTURE_2D_ARRAY,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D_ARRAY,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D_ARRAY,e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR),e.texParameteri(e.TEXTURE_2D_ARRAY,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texImage3D(e.TEXTURE_2D_ARRAY,0,e.RGBA,c,d,r,0,e.RGBA,e.UNSIGNED_BYTE,h),e.generateMipmap(e.TEXTURE_2D_ARRAY),p}(e,t),o={beginFrame:v(e),renderRects:x(e),renderDiscs:A(e,n),renderGlyphs:y(e,n)};return e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),e.enable(e.BLEND),e.clearColor(.05,.2,.05,1),o}(n,e),r=function(){const e=6,t=C(e);return{tLast:void 0,gameState:u.Paused,graph:t,enemy:{nodeIndex:t.goal,progressFraction:0},pointerGridPos:void 0,dtCapture:l,dtElapsed:0,level:e}}();function a(e,n){const o=t.getBoundingClientRect(),a=i.fromValues(t.width,t.height),s=i.fromValues(e-o.left,o.bottom-n);return function(e,t,n){const o=e[0],r=e[1];let a,s;t[0]*r<t[1]*o?(a=o,s=a*t[1]/t[0]):(s=r,a=s*t[0]/t[1]);const c=(a-o)/2+.5,d=(s-r)/2+.5,l=n[0]*(a/t[0])-c,f=n[1]*(s/t[1])-d;return i.fromValues(l,f)}(r.graph.extents,a,s)}function s(){requestAnimationFrame((e=>E(e,o,r)))}function c(){s()}t.onpointerdown=e=>{const t=a(e.clientX,e.clientY),n=Math.floor(t[0]),o=Math.floor(t[1]);n<0||o<0||n>=r.graph.extents[0]-1||o>=r.graph.extents[1]-1?r.gameState!==u.Lost&&r.gameState!==u.Won||(g(r),s()):F(r.graph,[n,o])&&(U(r.graph),r.gameState!==u.Lost&&(r.graph.pathIsWin&&r.gameState!==u.Won?r.gameState=u.Won:r.gameState===u.Paused&&(r.gameState=u.Active)),s())},t.onmousemove=e=>{const t=a(e.clientX,e.clientY);void 0!==r.pointerGridPos&&r.pointerGridPos[0]===t[0]&&r.pointerGridPos[1]===t[1]||(r.pointerGridPos=t,p(r.gameState)&&s())},t.onmouseenter=e=>{const t=a(e.clientX,e.clientY);void 0!==r.pointerGridPos&&r.pointerGridPos[0]===t[0]&&r.pointerGridPos[1]===t[1]||(r.pointerGridPos=t,p(r.gameState)&&s())},t.onmouseleave=e=>{r.pointerGridPos=void 0,p(r.gameState)&&s()},document.body.addEventListener("keydown",(e=>{"KeyR"===e.code?(e.preventDefault(),g(r),s()):"KeyP"===e.code?(e.preventDefault(),r.gameState===u.Active?r.gameState=u.Paused:r.gameState===u.Paused&&(r.gameState=u.Active,s())):"PageDown"===e.code?(e.preventDefault(),r.level<30&&(++r.level,g(r),s())):"PageUp"===e.code&&(e.preventDefault(),r.level>0&&(--r.level,g(r),s()))})),window.addEventListener("resize",c),s()}(e)}))};const l=.75;class f{pairs=[];add(e,t){t<e&&([e,t]=[t,e]);for(const n of this.pairs)if(n[0]===e&&n[1]===t)return;this.pairs.push([e,t])}remove(e,t){t<e&&([e,t]=[t,e]);for(let n=0;n<this.pairs.length;)this.pairs[n][0]===e&&this.pairs[n][1]===t?(this.pairs[n]=this.pairs[this.pairs.length-1],--this.pairs.length):++n}has(e,t){t<e&&([e,t]=[t,e]);for(const n of this.pairs)if(n[0]===e&&n[1]===t)return!0;return!1}}let u;var h;function p(e){return e!==u.Active}function g(e){e.graph=C(e.level),e.enemy.nodeIndex=e.graph.goal,e.enemy.progressFraction=0,e.dtCapture=l,e.dtElapsed=0,e.gameState=u.Paused}function v(e){return()=>{const t=e.canvas;!function(e){const t=e.parentNode,n=t.getBoundingClientRect();e.width===n.width&&e.height===n.height||(e.width=n.width,e.height=n.height)}(t);const n=t.clientWidth,o=t.clientHeight;return e.viewport(0,0,n,o),e.clear(e.COLOR_BUFFER_BIT),i.fromValues(n,o)}}function A(e,t){const n={vPosition:0,vScaleAndOffset:1,vDiscColorAndOpacity:2,vGlyphColor:3,vGlyphIndex:4},o=[1,-.5,.5,.45],r=R(e,"#version 300 es\n        // per-vertex parameters\n        in highp vec2 vPosition;\n        // per-instance parameters\n        in highp vec4 vScaleAndOffset;\n        in highp vec4 vDiscColorAndOpacity;\n        in highp vec3 vGlyphColor;\n        in highp float vGlyphIndex;\n\n        uniform mat4 uMatScreenFromWorld;\n        uniform vec4 uScaleAndOffsetGlyphFromDisc;\n\n        out highp vec2 fDiscPosition;\n        out highp vec3 fGlyphTexCoord;\n        out highp vec4 fDiscColorAndOpacity;\n        out highp vec3 fGlyphColor;\n\n        void main() {\n            fDiscPosition = vPosition;\n            fGlyphTexCoord = vec3(vPosition * uScaleAndOffsetGlyphFromDisc.xy + uScaleAndOffsetGlyphFromDisc.zw, vGlyphIndex);\n            fDiscColorAndOpacity = vDiscColorAndOpacity;\n            fGlyphColor = vGlyphColor;\n            gl_Position = uMatScreenFromWorld * vec4(vPosition * vScaleAndOffset.xy + vScaleAndOffset.zw, 0, 1);\n        }\n    ","#version 300 es\n        in highp vec2 fDiscPosition;\n        in highp vec3 fGlyphTexCoord;\n        in highp vec4 fDiscColorAndOpacity;\n        in highp vec3 fGlyphColor;\n\n        uniform highp sampler2DArray uGlyphOpacity;\n\n        out lowp vec4 fragColor;\n\n        void main() {\n            highp vec2 distFromCenter = abs(fGlyphTexCoord.xy - vec2(0.5, 0.5));\n            highp float glyphOpacity =\n                step(0.0, 0.5 - max(distFromCenter.x, distFromCenter.y)) *\n                texture(uGlyphOpacity, fGlyphTexCoord).x;\n            highp float r = length(fDiscPosition);\n            highp float aaf = fwidth(r);\n            highp float discOpacity = fDiscColorAndOpacity.w * (1.0 - smoothstep(1.0 - aaf, 1.0, r));\n            highp vec3 color = mix(fDiscColorAndOpacity.xyz, fGlyphColor, glyphOpacity);\n            fragColor = vec4(color, discOpacity);\n        }\n    ",n),i=e.getUniformLocation(r,"uMatScreenFromWorld"),a=e.getUniformLocation(r,"uScaleAndOffsetGlyphFromDisc"),s=e.getUniformLocation(r,"uGlyphOpacity"),c=24,d=new ArrayBuffer(1536),l=new Float32Array(d),f=new Uint32Array(d),u=e.createVertexArray();e.bindVertexArray(u);const h=function(e){const t=new Float32Array(12);let n=0;function o(e,o){t[n++]=e,t[n++]=o}o(-1,-1),o(1,-1),o(1,1),o(1,1),o(-1,1),o(-1,-1);const r=e.createBuffer();return e.bindBuffer(e.ARRAY_BUFFER,r),e.bufferData(e.ARRAY_BUFFER,t,e.STATIC_DRAW),r}(e);e.bindBuffer(e.ARRAY_BUFFER,h),e.enableVertexAttribArray(n.vPosition),e.vertexAttribPointer(n.vPosition,2,e.FLOAT,!1,0,0);const p=e.createBuffer();return e.bindBuffer(e.ARRAY_BUFFER,p),e.bufferData(e.ARRAY_BUFFER,d.byteLength,e.DYNAMIC_DRAW),e.enableVertexAttribArray(n.vScaleAndOffset),e.enableVertexAttribArray(n.vDiscColorAndOpacity),e.enableVertexAttribArray(n.vGlyphColor),e.enableVertexAttribArray(n.vGlyphIndex),e.vertexAttribPointer(n.vScaleAndOffset,4,e.FLOAT,!1,c,0),e.vertexAttribPointer(n.vDiscColorAndOpacity,4,e.UNSIGNED_BYTE,!0,c,16),e.vertexAttribPointer(n.vGlyphColor,3,e.UNSIGNED_BYTE,!0,c,20),e.vertexAttribPointer(n.vGlyphIndex,1,e.UNSIGNED_BYTE,!1,c,23),e.vertexAttribDivisor(n.vScaleAndOffset,1),e.vertexAttribDivisor(n.vDiscColorAndOpacity,1),e.vertexAttribDivisor(n.vGlyphColor,1),e.vertexAttribDivisor(n.vGlyphIndex,1),e.bindVertexArray(null),(n,h)=>{e.useProgram(r),e.bindVertexArray(u),e.uniformMatrix4fv(i,!1,n),e.uniform4fv(a,o),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D_ARRAY,t),e.uniform1i(s,0),e.bindBuffer(e.ARRAY_BUFFER,p);let g=0;for(;g<h.length;){const t=Math.min(64,h.length-g);for(let e=0;e<t;++e){const t=h[g+e];let n=e*c/4;l[n+0]=t.radius,l[n+1]=t.radius,l[n+2]=t.position[0],l[n+3]=t.position[1],f[n+4]=t.discColor,f[n+5]=(16777215&t.glyphColor)+(t.glyphIndex<<24)}e.bufferSubData(e.ARRAY_BUFFER,0,d),e.drawArraysInstanced(e.TRIANGLES,0,6,t),g+=t}e.bindVertexArray(null)}}function x(e){const t={vPosition:0,vColor:1},n=R(e,"#version 300 es\n        in vec2 vPosition;\n        in vec4 vColor;\n\n        uniform mat4 uMatScreenFromWorld;\n\n        out highp vec4 fColor;\n\n        void main() {\n            fColor = vColor;\n            gl_Position = uMatScreenFromWorld * vec4(vPosition, 0, 1);\n        }\n    ","#version 300 es\n        in highp vec4 fColor;\n\n        out lowp vec4 fragColor;\n\n        void main() {\n            fragColor = fColor;\n        }\n    ",t),o=e.getUniformLocation(n,"uMatScreenFromWorld"),r=2*Float32Array.BYTES_PER_ELEMENT+Uint32Array.BYTES_PER_ELEMENT,i=r,a=new ArrayBuffer(256*r),c=new Float32Array(a),d=new Uint32Array(a),l=e.createBuffer();let f=0;const u=s.create(),h=e.createVertexArray();e.bindVertexArray(h),e.enableVertexAttribArray(t.vPosition),e.enableVertexAttribArray(t.vColor),e.bindBuffer(e.ARRAY_BUFFER,l),e.vertexAttribPointer(t.vPosition,2,e.FLOAT,!1,r,0),e.vertexAttribPointer(t.vColor,4,e.UNSIGNED_BYTE,!0,r,8),e.bufferData(e.ARRAY_BUFFER,a,e.DYNAMIC_DRAW);m(e,64);function p(){f<=0||(e.useProgram(n),e.bindVertexArray(h),e.uniformMatrix4fv(o,!1,u),e.bindBuffer(e.ARRAY_BUFFER,l),e.bufferSubData(e.ARRAY_BUFFER,0,c,0),e.drawElements(e.TRIANGLES,6*f,e.UNSIGNED_SHORT,0),e.bindVertexArray(null),f=0)}return e.bindVertexArray(null),{start:function(e){s.copy(u,e)},addRect:function(e,t,n,o,r){f>=64&&p();const a=f*i;c[a+0]=e,c[a+1]=t,d[a+2]=r,c[a+3]=n,c[a+4]=t,d[a+5]=r,c[a+6]=e,c[a+7]=o,d[a+8]=r,c[a+9]=n,c[a+10]=o,d[a+11]=r,++f},flush:p}}function y(e,t){const n={vPosition:0,vTexcoord:1,vColor:2},o=R(e,"#version 300 es\n        in vec2 vPosition;\n        in vec3 vTexcoord;\n        in vec4 vColor;\n\n        uniform mat4 uMatScreenFromWorld;\n\n        out highp vec3 fTexcoord;\n        out highp vec4 fColor;\n\n        void main() {\n            fTexcoord = vTexcoord;\n            fColor = vColor;\n            gl_Position = uMatScreenFromWorld * vec4(vPosition, 0, 1);\n        }\n    ","#version 300 es\n        in highp vec3 fTexcoord;\n        in highp vec4 fColor;\n\n        uniform highp sampler2DArray uOpacity;\n\n        out lowp vec4 fragColor;\n\n        void main() {\n            fragColor = fColor * vec4(1, 1, 1, texture(uOpacity, fTexcoord));\n        }\n    ",n),r=e.getUniformLocation(o,"uMatScreenFromWorld"),i=e.getUniformLocation(o,"uOpacity"),a=2*Float32Array.BYTES_PER_ELEMENT+2*Uint32Array.BYTES_PER_ELEMENT,c=a,d=new ArrayBuffer(256*a),l=new Float32Array(d),f=new Uint32Array(d),u=e.createBuffer();let h=0;const p=s.create(),g=e.createVertexArray();e.bindVertexArray(g),e.enableVertexAttribArray(n.vPosition),e.enableVertexAttribArray(n.vTexcoord),e.enableVertexAttribArray(n.vColor),e.bindBuffer(e.ARRAY_BUFFER,u),e.vertexAttribPointer(n.vPosition,2,e.FLOAT,!1,a,0),e.vertexAttribPointer(n.vTexcoord,3,e.UNSIGNED_BYTE,!1,a,8),e.vertexAttribPointer(n.vColor,4,e.UNSIGNED_BYTE,!0,a,12),e.bufferData(e.ARRAY_BUFFER,d,e.DYNAMIC_DRAW);m(e,64);function v(){h<=0||(e.useProgram(o),e.bindVertexArray(g),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D_ARRAY,t),e.uniform1i(i,0),e.uniformMatrix4fv(r,!1,p),e.bindBuffer(e.ARRAY_BUFFER,u),e.bufferSubData(e.ARRAY_BUFFER,0,l,0),e.drawElements(e.TRIANGLES,6*h,e.UNSIGNED_SHORT,0),e.bindVertexArray(null),h=0)}return e.bindVertexArray(null),{start:function(e){s.copy(p,e)},addGlyph:function(e,t,n,o,r,i){h>=64&&v();const a=h*c,s=r<<16;l[a+0]=e,l[a+1]=t,f[a+2]=s+256,f[a+3]=i,l[a+4]=n,l[a+5]=t,f[a+6]=s+257,f[a+7]=i,l[a+8]=e,l[a+9]=o,f[a+10]=s,f[a+11]=i,l[a+12]=n,l[a+13]=o,f[a+14]=s+1,f[a+15]=i,++h},flush:v}}function m(e,t){const n=new Uint16Array(6*t);for(let e=0;e<t;++e){let t=6*e,o=4*e;n[t+0]=o+0,n[t+1]=o+1,n[t+2]=o+2,n[t+3]=o+2,n[t+4]=o+1,n[t+5]=o+3}const o=e.createBuffer();return e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,o),e.bufferData(e.ELEMENT_ARRAY_BUFFER,n,e.STATIC_DRAW),o}function E(e,t,n){const o=e/1e3,r=p(n.gameState)||void 0===n.tLast?0:Math.min(1/30,o-n.tLast);n.tLast=o,r>0&&function(e,t){e.dtCapture-=t;for(;e.dtCapture<=0;)e.dtCapture+=l;e.gameState===u.Active&&(e.dtElapsed+=t)}(n,r),function(e,t){const n=e.beginFrame(),o=s.create();if(function(e,t,n){const o=e[0],r=e[1];let i,a;t[0]*r<t[1]*o?(i=o/2,a=i*t[1]/t[0]):(a=r/2,i=a*t[0]/t[1]);const c=(o-1)/2,d=(r-1)/2;s.ortho(n,c-i,c+i,d-a,d+a,1,-1)}(t.graph.extents,n,o),void 0!==t.pointerGridPos){const n=Math.floor(t.pointerGridPos[0]),r=Math.floor(t.pointerGridPos[1]);n>=0&&r>=0&&n<t.graph.extents[0]-1&&r<t.graph.extents[1]-1&&function(e,t){let n=P(e,t[0],t[1]),o=P(e,t[0]+1,t[1]),r=P(e,t[0],t[1]+1),i=P(e,t[0]+1,t[1]+1);if(void 0===n||void 0===o||void 0===r||void 0===i)return!1;e.nodes[n].next!==r&&e.nodes[r].next!==n||([o,r]=[r,o]);0===e.nodes[r].group&&([n,r]=[r,n],[o,i]=[i,o]);e.nodes[o].next===n&&([n,o]=[o,n],[r,i]=[i,r]);let a=e.nodes[n],s=e.nodes[o],c=e.nodes[r],d=e.nodes[i];return a.next===o&&((c.next===i||d.next===r)&&(c.next!==n&&(s.next!==i&&d.next!==o)))}(t.graph,[n,r])&&e.renderDiscs(o,[{position:[n+.5,r+.5],radius:.75,discColor:276856960,glyphIndex:32,glyphColor:276856960}])}e.renderRects.start(o),function(e,t,n,o,r){const i=.1,a=4278255615,s=4280303632;for(let t=0;t<e.nodes.length;++t){const o=e.nodes[t],r=o.next;if(void 0===r)continue;const c=e.nodes[r],d=c.coord[0]-o.coord[0],l=c.coord[1]-o.coord[1],f=o.coord[0],u=o.coord[1],h=_(s,a,o.sectionLength/e.nodes.length),p=_(s,a,c.sectionLength/e.nodes.length),g=Math.abs(d)*(.25-.5*i)+i,v=Math.abs(l)*(.25-.5*i)+i,A=f+d*(.25-i/2),x=u+l*(.25-i/2),y=f+d*(.75+.5*i),m=u+l*(.75+.5*i);n.addRect(A-g,x-v,A+g,x+v,h),n.addRect(y-g,m-v,y+g,m+v,p)}const c=4279242768;for(const t of e.blockedEdges.pairs){const o=.1+.5*Math.abs(e.nodes[t[1]].coord[1]-e.nodes[t[0]].coord[1]),r=.1+.5*Math.abs(e.nodes[t[1]].coord[0]-e.nodes[t[0]].coord[0]),i=(e.nodes[t[0]].coord[0]+e.nodes[t[1]].coord[0])/2,a=(e.nodes[t[0]].coord[1]+e.nodes[t[1]].coord[1])/2;n.addRect(i-o,a-r,i+o,a+r,c)}}(t.graph,t.gameState,e.renderRects,e.renderDiscs),e.renderRects.flush(),function(e,t,n,o){const r=`${e=Math.floor(e)}/${t}`,i=r.length,a=4294967295,c=40,d=20,l=Math.max(1,Math.floor(o[0]/(8*c))),f=Math.max(1,Math.floor(o[1]/(16*d))),u=Math.min(l,f),h=8*u,p=16*u,g=o[0]/h,v=o[1]/p,A=-Math.floor((o[0]-i*h)/2)/h,x=0,y=s.create();s.ortho(y,A,A+g,x,x+v,1,-1),n.renderGlyphs.start(y);for(let e=0;e<i;++e){const t=r.charCodeAt(e);n.renderGlyphs.addGlyph(e,0,e+1,1,t,a)}n.renderGlyphs.flush()}(t.dtElapsed,(r=t.graph,Math.floor(.75*r.nodes.length)),e,n);var r}(t,n),p(n.gameState)||requestAnimationFrame((e=>E(e,t,n)))}function R(e,t,n,o){const r=b(e,e.VERTEX_SHADER,t),i=b(e,e.FRAGMENT_SHADER,n),a=e.createProgram();e.attachShader(a,r),e.attachShader(a,i);for(const t in o)e.bindAttribLocation(a,o[t],t);return e.linkProgram(a),e.getProgramParameter(a,e.LINK_STATUS)||alert("Unable to initialize the shader program: "+e.getProgramInfoLog(a)),a}function b(e,t,n){const o=e.createShader(t);return e.shaderSource(o,n),e.compileShader(o),e.getShaderParameter(o,e.COMPILE_STATUS)||(alert("An error occurred compiling the shaders: "+e.getShaderInfoLog(o)),e.deleteShader(o)),o}function T(e){return Math.floor(Math.random()*e)}function _(e,t,n){const o=Math.floor(S(255&e,255&t,n)),r=Math.floor(S(e>>8&255,t>>8&255,n)),i=Math.floor(S(e>>16&255,t>>16&255,n));return(Math.floor(S(e>>24&255,t>>24&255,n))<<24)+(i<<16)+(r<<8)+o}function S(e,t,n){return e+(t-e)*n}function P(e,t,n){if(!(t<0||n<0||t>=e.extents[0]||n>=e.extents[1]))return t*e.extents[1]+n}function C(e){const t=5+Math.floor(e/3),n=t+e%3;let o={nodes:[],extents:[n,t],start:0,goal:0,blockedEdges:new f,pathIsBlocked:!1,pathIsWin:!1};for(let e=0;e<n;++e)for(let n=0;n<t;++n){const t={coord:[e,n],next:void 0,group:0,sectionLength:1,captured:!1};o.nodes.push(t)}return function(e){const t=e.extents[0],n=e.extents[1],o=(e,t)=>e*n+t;for(const n of e.nodes){const e=n.coord[0],r=n.coord[1];n.next=0==(1&r)?e>0?o(e-1,r):r>0?o(e,r-1):void 0:e<t-1?o(e+1,r):r>0?o(e,r-1):void 0}e.goal=0==(1&n)?n-1:t*n-1}(o),G(o),D(o),B(o),function(e,t){const n=new f;for(let t=0;t<e.extents[0]-1;++t)for(let o=0;o<e.extents[1];++o){const r=P(e,t,o),i=P(e,t+1,o);e.nodes[r].next!==i&&e.nodes[i].next!==r&&n.add(r,i)}for(let t=0;t<e.extents[0];++t)for(let o=0;o<e.extents[1]-1;++o){const r=P(e,t,o),i=P(e,t,o+1);e.nodes[r].next!==i&&e.nodes[i].next!==r&&n.add(r,i)}let o=Math.min(n.pairs.length,Math.floor(n.pairs.length*t));for(;o>0;){const t=T(n.pairs.length);e.blockedEdges.add(n.pairs[t][0],n.pairs[t][1]),n.pairs[t]=n.pairs[n.pairs.length-1],--n.pairs.length,--o}}(o,.5),D(o),B(o),U(o),o}function D(e){for(let t=7*e.extents[0]*e.extents[1];t>0;--t){F(e,[T(e.extents[0]-1),T(e.extents[1]-1)])}}function F(e,t){let n=P(e,t[0],t[1]),o=P(e,t[0]+1,t[1]),r=P(e,t[0],t[1]+1),i=P(e,t[0]+1,t[1]+1);if(void 0===n||void 0===o||void 0===r||void 0===i)return!1;e.nodes[n].next!==r&&e.nodes[r].next!==n||([o,r]=[r,o]),0===e.nodes[r].group&&([n,r]=[r,n],[o,i]=[i,o]),e.nodes[o].next===n&&([n,o]=[o,n],[r,i]=[i,r]);let a=e.nodes[n],s=e.nodes[o],c=e.nodes[r],d=e.nodes[i];return a.next===o&&((c.next===i||d.next===r)&&(c.next!==n&&(s.next!==i&&(d.next!==o&&(d.next===r?(a.next=r,d.next=o):0!=c.group?(M(e,i,r),a.next=r,d.next=o):!function(e,t,n){if(void 0===t)return!1;for(let o=e.nodes[t].next;o!==t&&void 0!==o;o=e.nodes[o].next)if(o===n)return!0;return!1}(e,o,r)?(M(e,i,n),c.next=n,d.next=o):(M(e,o,r),a.next=r,s.next=i),function(e){for(const t of e.nodes)t.group=void 0;let t=0;for(let n=e.goal;void 0!==n&&void 0===e.nodes[n].group;n=e.nodes[n].next)e.nodes[n].group=t;++t;for(let n=0;n<e.nodes.length;++n){for(let o=n;void 0!==o&&void 0===e.nodes[o].group;o=e.nodes[o].next)e.nodes[o].group=t;++t}}(e),G(e),!0)))))}function G(e){const t=[];for(let n=e.goal;void 0!==n;n=e.nodes[n].next)t.push(n);t.reverse(),e.pathIsBlocked=!1;for(let n=1;n<t.length;++n)if(e.blockedEdges.has(t[n-1],t[n])){e.pathIsBlocked=!0;break}e.pathIsWin=!e.pathIsBlocked&&t.length===e.nodes.length}function U(e){const t=[],n=[];for(let o=0;o<e.nodes.length;++o)t.push(o),n.push(1);for(let o=0;o<e.nodes.length;++o){let r=o,i=e.nodes[r].next;for(;void 0!==i&&t[i]!==t[o]&&!e.blockedEdges.has(r,i);)++n[t[o]],--n[t[i]],t[i]=t[o],r=i,i=e.nodes[r].next}for(let o=0;o<e.nodes.length;++o)e.nodes[o].sectionLength=n[t[o]]}function M(e,t,n){let o,r=t;for(;;){const t=e.nodes[r].next;if(e.nodes[r].next=o,r===n)break;o=r,r=t}}function B(e){const t=[];for(let n=0;n<e.extents[0]-1;++n)for(let o=0;o<e.extents[1]-1;++o)t.push([n,o]);for(;t.length>0;){const n=T(t.length),o=t[n];t[n]=t[t.length-1],--t.length;const r=P(e,o[0],o[1]),i=P(e,o[0]+1,o[1]),a=P(e,o[0],o[1]+1),s=P(e,o[0]+1,o[1]+1);if(void 0===r||void 0===i||void 0===a||void 0===s)continue;const c=e.nodes[r],d=e.nodes[i],l=e.nodes[a],f=e.nodes[s];c.group===d.group&&c.group===l.group&&d.group===f.group&&l.group===f.group||F(e,o)}}(h=u||(u={}))[h.Paused=0]="Paused",h[h.Active=1]="Active",h[h.Won=2]="Won",h[h.Lost=3]="Lost";
//# sourceMappingURL=index.43600d6c.js.map
