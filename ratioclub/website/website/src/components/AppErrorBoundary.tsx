import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

// Local recovery only. No external telemetry or submitted form values are sent.
export class AppErrorBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state = {failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(error:Error, info:ErrorInfo){console.error('Ratioclub render failed', error, info.componentStack);}
  render(){
    if(this.state.failed)return <main className="pending-page"><h1>Something went wrong.</h1><p>Please reload the page to try again.</p><button className="primary-action" onClick={()=>location.reload()}>RELOAD PAGE</button></main>;
    return this.props.children;
  }
}
