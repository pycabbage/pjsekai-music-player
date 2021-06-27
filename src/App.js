import { Component } from "react"
import "./App.css"

function MusicCard(props) {
  return (
    <div
      className={"musicCard id" + props.data.id}
      onClick={() => props.playfunc(props.data.id)}
    >
      <img
        src={`https://assets.pjsek.ai/file/pjsekai-assets/startapp/music/jacket/${props.data.assetbundleName}/${props.data.assetbundleName}.png`}
        alt={props.data.title}
      />
      <div className="text">
        {props.data.title}
      </div>
    </div>
  )
}

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      acquired: false
    }
    this.audio = new Audio()
    this.dataURL = {
      music: "https://api.pjsek.ai/database/master/musics?$limit=1000&$sort[publishedAt]=-1&$sort[id]=-1&$skip=0",
      bgmAssets: "https://api.pjsek.ai/assets?parent=ondemand/music/long&$limit=1000&$sort[isDir]=-1&$sort[path]=1",
    }
    this.play = this.play.bind(this)
  }

  componentDidMount() {
    fetch(this.dataURL.music)
    .then(response=>response.json())
      .then(data => {
        this.musicData = data
        fetch(this.dataURL.bgmAssets)
          .then(response=>response.json())
          .then(res => {
            this.bgmAssetsData = res
            this.setState({acquired: true})
          })
      })
  }

  play(id) {
    var asidarr = []
    this.bgmAssetsData.data.map(ass=>{
      var path = ass.path
      var asid = path.split("/")[path.split("/").length - 1]
      var parse = this.parseID(asid)
      if (parse.id == id) {
        asidarr.push(asid)
      }
    })
    console.log(asidarr)
    asidarr.map(s => { 
      if (s.match(/se_.+/)) {
        this.audio.src = `https://assets.pjsek.ai/file/pjsekai-assets/ondemand/music/long/${s}/${s}.flac`
        this.audio.play()
      }
    })
  }

  parseID(s) {
    var id = -1;
    if (s.match(/\d+_\d\d/)) {
      return {
        id: parseInt(s.match(/(\d+)_\d\d/)[1]),
        num: parseInt(s.match(/\d+_(\d\d)/)[1]),
        type: ""
      }
    } else if (s.match(/(an|se|vs)_\d+_\d\d/)) {
      return {
        id: parseInt(s.match(/(an|se|vs)_(\d+)_\d\d/)[1]),
        num: parseInt(s.match(/(an|se|vs)_\d+_(\d\d)/)[1]),
        type: s.match(/((an|se|vs))_\d+_\d\d/)[1]
      }
    }
    return id
  }

  render() {
    return (
      <div className="App">
        <div className="header">
          <form>
            <input type="text" name="query" placeholder="Search..."></input>
          </form>
        </div>
          {this.state.acquired ? (()=>{
            var res = []
            for (var i in this.musicData.data) {
              res.push(<MusicCard
                data={this.musicData.data[i]}
                playfunc={id=>this.play(id)}
              />)
            }
            return <div className="container">{res}</div>
        })() : (<div className="container">loading</div>)}
        <div className="footer">
        </div>
      </div>
    )
  }
}
