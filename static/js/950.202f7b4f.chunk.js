!function(){"use strict";var e={95950:function(e,n,r){var t=r(74165),a=r(15861),o=r(16296),u=r(38380),i=r(29439),c=(r(763),r(54098)),s=function(e){return(0,u.lub)((function(){for(var n=(0,i.Z)(e.shape,4),r=n[0],t=n[1],a=n[2],o=n[3],c=r*a*t,s=e.reshape([c,o]),f=[],d=0;d<o;d++){var p=s.gather([d],1).flatten();f.push(p)}return(0,u.knu)(f)}))},f=function(){var e=(0,a.Z)((0,t.Z)().mark((function e(n,r){var a,o,i;return(0,t.Z)().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return a=Array.from(r),o=(0,u.RRF)(a,"bool"),e.next=4,(0,u.anm)(n,o,1);case 4:return i=e.sent,o.dispose(),e.abrupt("return",i);case 7:case"end":return e.stop()}}),e)})));return function(n,r){return e.apply(this,arguments)}}();var d=function(){var e=(0,a.Z)((0,t.Z)().mark((function e(n){var r,a,o,u,i,d,p;return(0,t.Z)().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(a=void 0,!n.decodedMask){e.next=11;break}return u=s(n.data),e.next=5,f(u,n.decodedMask);case 5:r=e.sent,u.dispose(),a=n.decodedMask,o={height:n.data.shape[1],width:n.data.shape[2]},e.next=23;break;case 11:if(!n.encodedMask){e.next=22;break}return i=Uint8Array.from((0,c.Jx)(n.encodedMask)),d=s(n.data),e.next=16,f(d,i);case 16:r=e.sent,d.dispose(),a=i,o={height:n.data.shape[1],width:n.data.shape[2]},e.next=23;break;case 22:r=s(n.data);case 23:return p={channels:r.arraySync(),maskData:a,maskShape:o},r.dispose(),e.abrupt("return",p);case 26:case"end":return e.stop()}}),e)})));return function(n){return e.apply(this,arguments)}}();self.onmessage=function(){var e=(0,a.Z)((0,t.Z)().mark((function e(n){var r,a,i,c,s,f,p,l,h,v,x,b,k;return(0,t.Z)().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:r={},a=!1,i=!1,e.prev=3,s=(0,o.Z)(n.data.things);case 5:return e.next=7,s.next();case 7:if(!(a=!(f=e.sent).done)){e.next=18;break}return p=f.value,l=p.id,h=p.data,v=p.encodedMask,x=p.decodedMask,b=u.yXz(h),e.next=13,d({data:b,encodedMask:v,decodedMask:x});case 13:k=e.sent,r[l]=k;case 15:a=!1,e.next=5;break;case 18:e.next=24;break;case 20:e.prev=20,e.t0=e.catch(3),i=!0,c=e.t0;case 24:if(e.prev=24,e.prev=25,!a||null==s.return){e.next=29;break}return e.next=29,s.return();case 29:if(e.prev=29,!i){e.next=32;break}throw c;case 32:return e.finish(29);case 33:return e.finish(24);case 34:self.postMessage({kind:n.data.kind,data:r});case 35:case"end":return e.stop()}}),e,null,[[3,20,24,34],[25,,29,33]])})));return function(n){return e.apply(this,arguments)}}()},91386:function(e,n,r){r(69728)},54098:function(e,n,r){r.d(n,{Jx:function(){return t.Jx}});r(98222),r(71773);var t=r(36214);r(16393),r(91386),r(1396),r(55612)},36214:function(e,n,r){r.d(n,{Jx:function(){return t}});var t=function(e){for(var n=[],r=!0,t=0;t<e.length;t++){for(var a=0;a<e[t];a++)n.push(r?0:255);r=!r}return new Uint8ClampedArray(n)}}},n={};function r(t){var a=n[t];if(void 0!==a)return a.exports;var o=n[t]={id:t,loaded:!1,exports:{}};return e[t].call(o.exports,o,o.exports,r),o.loaded=!0,o.exports}r.m=e,r.x=function(){var e=r.O(void 0,[803,743,739],(function(){return r(95950)}));return e=r.O(e)},r.amdD=function(){throw new Error("define cannot be used indirect")},r.amdO={},function(){var e=[];r.O=function(n,t,a,o){if(!t){var u=1/0;for(f=0;f<e.length;f++){t=e[f][0],a=e[f][1],o=e[f][2];for(var i=!0,c=0;c<t.length;c++)(!1&o||u>=o)&&Object.keys(r.O).every((function(e){return r.O[e](t[c])}))?t.splice(c--,1):(i=!1,o<u&&(u=o));if(i){e.splice(f--,1);var s=a();void 0!==s&&(n=s)}}return n}o=o||0;for(var f=e.length;f>0&&e[f-1][2]>o;f--)e[f]=e[f-1];e[f]=[t,a,o]}}(),r.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(n,{a:n}),n},r.d=function(e,n){for(var t in n)r.o(n,t)&&!r.o(e,t)&&Object.defineProperty(e,t,{enumerable:!0,get:n[t]})},r.f={},r.e=function(e){return Promise.all(Object.keys(r.f).reduce((function(n,t){return r.f[t](e,n),n}),[]))},r.u=function(e){return"static/js/"+e+"."+{739:"117a753d",743:"89ae8f16",803:"a6df8bfa"}[e]+".chunk.js"},r.miniCssF=function(e){},r.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"===typeof window)return window}}(),r.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},r.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.nmd=function(e){return e.paths=[],e.children||(e.children=[]),e},r.p="/",function(){var e={950:1};r.f.i=function(n,t){e[n]||importScripts(r.p+r.u(n))};var n=self.webpackChunkpiximi=self.webpackChunkpiximi||[],t=n.push.bind(n);n.push=function(n){var a=n[0],o=n[1],u=n[2];for(var i in o)r.o(o,i)&&(r.m[i]=o[i]);for(u&&u(r);a.length;)e[a.pop()]=1;t(n)}}(),function(){var e=r.x;r.x=function(){return Promise.all([803,743,739].map(r.e,r)).then(e)}}();r.x()}();
//# sourceMappingURL=950.202f7b4f.chunk.js.map