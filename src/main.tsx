import {createRoot} from 'react-dom/client';
import {Component,type ReactNode} from 'react';
import {App} from './ui/App.tsx';
import './ui/styles/app.css';
class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}componentDidCatch(error:Error){console.error('页面渲染失败',{name:error.name});}render(){return this.state.failed?<main className="startup"><h1>页面暂时无法显示</h1><p>本机记录未被删除。请刷新重试，仍失败时保留网站数据并联系维护者。</p><button className="primary" onClick={()=>location.reload()}>重新打开</button></main>:this.props.children;}}
createRoot(document.getElementById('root')!).render(<ErrorBoundary><App/></ErrorBoundary>);
