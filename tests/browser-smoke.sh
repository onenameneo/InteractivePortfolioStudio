#!/bin/sh
# Run against a seeded, running site. BROWSE_BIN can point to a configured gstack browse wrapper.
set -eu
BROWSE_BIN=${BROWSE_BIN:-browse}
STUDIO_URL=${STUDIO_URL:-http://127.0.0.1:3100}
"$BROWSE_BIN" viewport 390x844
"$BROWSE_BIN" goto "$STUDIO_URL"
"$BROWSE_BIN" wait '.project-card:first-child'
"$BROWSE_BIN" js 'if(document.documentElement.scrollWidth>innerWidth)throw new Error("Mobile horizontal overflow");"PASS mobile width"'
"$BROWSE_BIN" js 'const stage=document.querySelector(".scene-stage").getBoundingClientRect();if(stage.x!==0||stage.y!==0||Math.abs(stage.width-innerWidth)>1||Math.abs(stage.height-innerHeight)>1)throw new Error("Room does not cover viewport");if(document.querySelectorAll(".chapter-panel").length!==5)throw new Error("Missing chapter panels");"PASS full-screen background and five foreground chapters"'
"$BROWSE_BIN" click '.project-card:first-child .project-heading'
"$BROWSE_BIN" wait 'dialog[open]'
"$BROWSE_BIN" js 'new Promise((resolve,reject)=>setTimeout(()=>document.querySelector("dialog[open]")?resolve("PASS dialog remains open after effect cleanup"):reject(new Error("Dialog closed unexpectedly")),100))'
"$BROWSE_BIN" press Escape
"$BROWSE_BIN" js 'if(document.querySelector("dialog[open]"))throw new Error("Escape did not close dialog");if(!document.activeElement?.classList.contains("project-card"))throw new Error("Focus not restored");"PASS Escape and focus restoration"'
"$BROWSE_BIN" js 'new Promise((resolve,reject)=>{const dock=document.querySelector(".chapter-dock"),seen=[];const observer=new MutationObserver(()=>seen.push(dock.dataset.active));observer.observe(dock,{attributes:true,attributeFilter:["data-active"]});dock.querySelectorAll("button")[4].click();setTimeout(()=>{observer.disconnect();if(dock.dataset.active!=="4"||seen.some(value=>value!=="4"))reject(new Error("Navigation highlighted intermediate chapters"));else resolve("PASS direct cross-chapter selection")},1200)})'
"$BROWSE_BIN" js 'new Promise((resolve,reject)=>{document.querySelector(".chapter-dock button").click();setTimeout(()=>{window.dispatchEvent(new WheelEvent("wheel"));const stopped=scrollY;setTimeout(()=>Math.abs(scrollY-stopped)<2?resolve("PASS user input interrupts navigation"):reject(new Error("Navigation kept scrolling after user input")),350)},120)})'
