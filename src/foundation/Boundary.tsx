import {Component,type ReactNode} from "react";
export default class Boundary extends Component<{children:ReactNode},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<section className="card crash-card" role="alert"><h2>Trang này chưa tải được</h2><p>Tiến trình đã lưu vẫn còn trên thiết bị.</p><button className="button primary" onClick={()=>window.location.reload()}>Tải lại trang</button><a className="button secondary" href="#/">Về góc học</a></section>:this.props.children;}
}
