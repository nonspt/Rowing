export class TrainingFeedback {
  private audio?:AudioContext;
  private lock?:WakeLockSentinel;
  async enable(sound:boolean):Promise<string> {
    const messages:string[]=[];
    if(sound){try{this.audio ||= new AudioContext();await this.audio.resume();}catch{messages.push('提示音不可用，请查看阶段文字。');}}
    if('wakeLock' in navigator){try{this.lock=await navigator.wakeLock.request('screen');}catch{messages.push('屏幕常亮不可用，请保持页面在前台。');}}else messages.push('当前环境不支持屏幕常亮。');
    return messages.join(' ');
  }
  beep(sound:boolean) {if(!sound||!this.audio||this.audio.state!=='running')return;const oscillator=this.audio.createOscillator(),gain=this.audio.createGain();oscillator.connect(gain);gain.connect(this.audio.destination);oscillator.frequency.value=660;gain.gain.setValueAtTime(.08,this.audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,this.audio.currentTime+.18);oscillator.start();oscillator.stop(this.audio.currentTime+.2);}
  async release():Promise<void> {if(this.lock){const lock=this.lock;this.lock=undefined;try{await lock.release();}catch(error){console.warn('屏幕常亮释放失败',error instanceof Error?error.name:'unknown');}}}
}
