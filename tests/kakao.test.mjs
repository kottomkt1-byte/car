import test from 'node:test';
import assert from 'node:assert/strict';
import {createKakaoClient} from '../src/kakao.js';
import {kakaoSharePayload} from '../src/share.js';
import {recommend,CARS} from '../src/calculator.js';

function fixture(options={}){
 const scripts=[],win={},calls=[];
 const doc={createElement:()=>({remove(){this.removed=true;}}),head:{append(script){scripts.push(script);}}};
 let initialized=false;
 const sdk={isInitialized:()=>initialized,init:key=>{initialized=true;calls.push(key);},Share:{sendDefault:payload=>{calls.push(payload);}}};
 const client=createKakaoClient({key:'a'.repeat(32),doc,win,...options});
 return {client,scripts,win,sdk,calls};
}
test('unconfigured integration makes no SDK request and cannot send',async()=>{
 const {client,scripts}=fixture({key:''});assert.equal(client.configured,false);
 await assert.rejects(client.load());assert.equal(scripts.length,0);assert.throws(()=>client.send({}));
});
test('SDK loads only on demand, deduplicates loads and sends in the click call',async()=>{
 const {client,scripts,win,sdk,calls}=fixture();assert.equal(scripts.length,0);
 const first=client.load(),second=client.load();assert.equal(first,second);assert.equal(scripts.length,1);
 assert.match(scripts[0].src,/^https:\/\/t1\.kakaocdn\.net\//);assert.match(scripts[0].integrity,/^sha384-/);
 assert.equal(client.isReady(),false);win.Kakao=sdk;scripts[0].onload();await first;
 await client.load();assert.equal(calls.length,1);assert.equal(client.isReady(),true);
 const payload={objectType:'text',text:'추천 차량'};client.send(payload);assert.equal(calls[1],payload);
});
test('failed SDK loading can retry without a permanent disabled state',async()=>{
 const {client,scripts,win,sdk}=fixture();const failed=client.load();scripts[0].onerror();
 await assert.rejects(failed);assert.ok(scripts[0].removed);assert.equal(client.isReady(),false);
 const retry=client.load();assert.equal(scripts.length,2);win.Kakao=sdk;scripts[1].onload();await retry;
 assert.equal(client.isReady(),true);
});
test('hung SDK request times out, removes handlers, and permits retry',async()=>{
 const {client,scripts}=fixture({timeout:5});await assert.rejects(client.load(),/timed out/);
 assert.equal(scripts[0].onload,null);assert.equal(scripts[0].onerror,null);assert.ok(scripts[0].removed);
 const retry=client.load();scripts[1].onerror();await assert.rejects(retry);
});
test('Kakao payload contains only affordable names and clean public links',()=>{
 const r=recommend({salary:19876,expenses:321,assets:54321});
 const p=kakaoSharePayload(r,'https://cars.example/?salary=19876#private');
 assert.equal(p.objectType,'text');assert.equal(p.buttonTitle,'나도 내 차 찾기');
 assert.deepEqual(p.link,{webUrl:'https://cars.example/',mobileWebUrl:'https://cars.example/'});
 for(const car of r.recommendations.filter(c=>c.affordable))assert.ok(p.text.includes(car.name));
 for(const secret of ['19876','54321','321','19,876','54,321'])assert.ok(!JSON.stringify(p).includes(secret));
 const partial={recommendations:[{name:'아반떼',affordable:true},{name:'비싼 비교 후보',affordable:false}]};
 assert.match(kakaoSharePayload(partial,'https://cars.example').text,/1대/);
 assert.doesNotMatch(kakaoSharePayload(partial,'https://cars.example').text,/비싼 비교 후보/);
 assert.throws(()=>kakaoSharePayload({recommendations:[]},'https://cars.example'));
 assert.throws(()=>kakaoSharePayload(r,'http://localhost:4173/'));
});
test('messages fit the 200-character text template, including future long names',()=>{
 const names=[...CARS.map(c=>c.name),'아'.repeat(200)].sort((a,b)=>b.length-a.length);
 const p=kakaoSharePayload({recommendations:names.slice(0,3).map(name=>({name,affordable:true}))},'https://cars.example');
 assert.ok(p.text.length<=200);assert.match(p.text,/1\./);assert.match(p.text,/2\./);assert.match(p.text,/3\./);
});
