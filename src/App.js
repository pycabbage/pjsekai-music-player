import { Component, useState } from "react";
import "./App.css"

// https://api.pjsek.ai/database/master/musicVocals?musicId=${}&$limit=10&$sort[seq]=1
// https://api.pjsek.ai/database/master/gameCharacters?$limit=40&$skip=0
// https://api.pjsek.ai/database/master/outsideCharacters?$limit=20&$skip=0

class MusicCard extends Component {
  constructor(props) {
    super(props);
    this.props = props
    this.state = {
      types: new Array()
    }
  }

  componentDidMount() {
    var type;
    fetch(
      `https://api.pjsek.ai/database/master/musicVocals?musicId=${this.props.data.id}&$limit=10&$sort[seq]=1`,
      { cache: "force-cache" }
    )
      .then((res) => res.json())
      .then((d) => d.data)
      .then((data) => {
        this.data = data;
        var r = data.map((d) => {
          type = d.assetbundleName.match(/(..)_/)[1];
          return (
            <SongTypeButton
              type={type}
              id={d.assetbundleName}
              onClick={() => this.props.playfunc(d.assetbundleName, type)}
            />
          );
        });
        this.setState({ types: r });
      });
  }

  render() {
    return (
      <div
        className={"musicCard id" + this.props.data.id}
        key={"msuicCard-" + this.props.data.id.toString()}
        onClick={() => this.props.playfunc(this.props.data.id, "se")}
      >
        <img
          src={`https://assets.pjsek.ai/file/pjsekai-assets/startapp/music/jacket/${this.props.data.assetbundleName}/${this.props.data.assetbundleName}.png`}
          alt={this.props.data.title}
        />
        <div className="right">
          <div className="text">{this.props.data.title}</div>
          <div className="typeSelector">{this.state.types}</div>
        </div>
      </div>
    );
  }
}

function SongTypeButton(props) {
  return (
    <div
      className={"songTypeButton " + props.type}
      onClick={e=>{
        e.stopPropagation()
        props.onClick(props)
      }}
    >
      {props.type.toUpperCase()}
    </div>
  );
}

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dragging: false,
      acquired: false,
      searchQuery: "",
      nowPlayingID: 0,
      loop: false,
      progress: 0,
    };
    this.dataURL = {
      music:
        "https://api.pjsek.ai/database/master/musics?$limit=1000&$sort[publishedAt]=-1&$sort[id]=-1&$skip=0",
      bgmAssets:
        "https://api.pjsek.ai/assets?parent=ondemand/music/long&$limit=1000&$sort[isDir]=-1&$sort[path]=1",
      gameCharacters:
      "https://api.pjsek.ai/database/master/gameCharacters?$limit=40&$skip=0&",
      outsideCharacters:
        "https://api.pjsek.ai/database/master/outsideCharacters?$limit=20&$skip=0",
    };
    this.play = this.play.bind(this);
    this.seek = this.seek.bind(this);
    this.audio = new Audio();
    this.audio.addEventListener("canplay", (e) => {
      this.audio.play();
    });
    this.audio.addEventListener("ended", (e) => {
      if (this.state.loop) this.audio.play();
      else this.setState({ nowPlayingID: 0 });
    });
    this.audio.addEventListener("timeupdate", (e) => {
      this.setState({
        progress:
          (this.audio.currentTime - this.audioOffset) /
          (this.audio.duration - this.audioOffset),
      });
    });
    this.audioOffset = 8;
  }

  componentDidMount() {
    fetch(this.dataURL.music, { cache: "force-cache" })
      .then((response) => response.json())
      .then((data) => {
        this.musicData = data;
      })
      .then(() => {
        fetch(this.dataURL.bgmAssets, { cache: "force-cache" })
          .then((response) => response.json())
          .then((res) => {
            this.bgmAssetsData = res;
          })
          .then(()=>{
            fetch(this.dataURL.gameCharacters, { cache: "force-cache" })
              .then((response) => response.json())
              .then((res) => {
                this.gameCharacters = res;
              })
              .then(()=>{
                fetch(this.dataURL.outsideCharacters, {
                  cache: "force-cache",
                })
                  .then((response) => response.json())
                  .then((res) => {
                    this.outsideCharacters = res;
                    this.setState({ acquired: true });
                  });
              });
          });
      });
  }

  toTime(t) {
    var m = Math.floor(t / 60);
    return `${m}:${("00" + (Math.floor(t) % 60)).slice(-2)}`;
  }

  getAssetidByID(id) {
    var asidarr = [];
    var res = {
      se: [],
      an: [],
      vs: [],
    };
    this.bgmAssetsData.data.map((ass) => {
      var path = ass.path;
      var asid = path.split("/")[path.split("/").length - 1];
      var parse = this.parseID(asid);
      if (parse.id === id) {
        asidarr.push(asid);
      }
    });
    asidarr.map((s) => {
      if (s.match(/se_.+/)) {
        res.se.push(s);
      } else if (s.match(/an_.+/)) {
        res.an.push(s);
      } else if (s.match(/vs_.+/)) {
        res.vs.push(s);
      } else if (s.match(/\d+_01/)) {
        res.vs.push(s);
      } else if (s.match(/\d+_02/)) {
        res.se.push(s);
      }
    });
    return res;
  }

  setMediaSession(asid) {
    var id = asid.match(/(..)_/)[1];
    var data = this.musicData.data.filter((d) => d.id === id)[0];
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: data.title,
      artist: "SEGA",
      album: "pjsekai player",
      artwork: [
        {
          src: `https://assets.pjsek.ai/file/pjsekai-assets/startapp/music/jacket/jacket_s_${id}/jacket_s_${id}.png`,
        },
      ],
    });
    navigator.mediaSession.setActionHandler("play", () => this.audio.play());
    navigator.mediaSession.setActionHandler("pause", () => this.audio.pause());
  }

  play(id, type) {
    var asid;
    if (typeof id == "number") {
      var asidarr = this.getAssetidByID(id);
      asid =
        asidarr[type][0] || asidarr.se[0] || asidarr.vs[0] || asidarr.an[0];
      this.setState({
        nowPlayingID: id,
        progress: 0,
      });
      document.title = this.musicData.data.filter((d) => d.id === id)[0].title;
    } else {
      asid = id;
      var nid = this.getIdByAssetId(id);
      this.setState({
        nowPlayingID: nid,
        progress: 0,
      });
      document.title = this.musicData.data.filter((d) => d.id === nid)[0].title;
    }
    this.audio.src = `https://assets.pjsek.ai/file/pjsekai-assets/ondemand/music/long/${asid}/${asid}.flac`;
    this.audio.currentTime = this.audioOffset;
    // this.audio.play()
  }

  parseID(s) {
    var id = -1;
    if (s.match(/\d+_\d\d/)) {
      return {
        id: parseInt(s.match(/(\d+)_\d\d/)[1]),
        num: parseInt(s.match(/\d+_(\d\d)/)[1]),
        type: "",
      };
    } else if (s.match(/(an|se|vs)_\d+_\d\d/)) {
      return {
        id: parseInt(s.match(/(an|se|vs)_(\d+)_\d\d/)[1]),
        num: parseInt(s.match(/(an|se|vs)_\d+_(\d\d)/)[1]),
        type: s.match(/((an|se|vs))_\d+_\d\d/)[1],
      };
    }
    return id;
  }

  getIdByAssetId(asid) {
    return parseInt(asid.match(/((an|vs|se)_)?(\d+)_\d+/)[3]);
  }

  seek(percent) {
    if (this.state.nowPlayingID) {
      this.audio.currentTime =
        this.audio.duration * percent + this.audioOffset * (1 - percent);
      this.setState({
        progress: percent,
      });
    }
  }

  render() {
    return (
      <div
        className="App"
        onMouseMove={(e) => {
          if (this.state.dragging) {
            this.seek(e.clientX / window.innerWidth);
          }
        }}
        onMouseUp={(e) => {
          if (this.state.dragging) {
            this.seek(e.clientX / window.innerWidth);
            this.setState({
              dragging: false,
            });
          }
        }}
      >
        <div className="header">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              this.setState({ searchQuery: e.target.query.value });
            }}
            onChange={(e) => {
              e.preventDefault();
              this.setState({ searchQuery: e.target.value });
            }}
          >
            <input type="text" name="query" placeholder="Search..."></input>
          </form>
        </div>
        {this.state.acquired ? (
          (() => {
            var res = [];
            for (var i in this.musicData.data.slice(0, 5)) {
              if (this.musicData.data[i].title.match(this.state.searchQuery)) {
                res.push(
                  <MusicCard
                    data={this.musicData.data[i]}
                    playfunc={(id, type) => this.play(id, type)}
                  />
                );
              }
            }
            return (
              <div
                className="container"
                onMouseDown={(e) => e.preventDefault()}
              >
                {res}
              </div>
            );
          })()
        ) : (
          <div className="container">loading</div>
        )}
        <div className="footer">
          <img
            src={
              this.state.nowPlayingID
                ? (() => {
                    var bid = "";
                    this.musicData.data.forEach((el) => {
                      if (el.id === this.state.nowPlayingID)
                        bid = el.assetbundleName;
                    });
                    return `https://assets.pjsek.ai/file/pjsekai-assets/startapp/music/jacket/${bid}/${bid}.png`;
                  })()
                : "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
            }
            alt={
              this.state.nowPlayingID
                ? (() => {
                    var title = "";
                    this.musicData.data.forEach((el) => {
                      if (el.id === this.state.nowPlayingID) title = el.title;
                    });
                    return title;
                  })()
                : ""
            }
          />
          <div
            className="controlButtonContainer"
            onClick={(e) => {
              this.state.nowPlayingID &&
                (this.audio.paused ? this.audio.play() : this.audio.pause());
            }}
          >
            <span className="material-icons">
              {this.audio.paused ? "play_arrow" : "pause"}
            </span>
          </div>
          <div className="titleText">
            {this.state.nowPlayingID
              ? (() => {
                  var title = "";
                  this.musicData.data.forEach((el) => {
                    if (el.id === this.state.nowPlayingID) title = el.title;
                  });
                  return title;
                })()
              : ""}
          </div>
          <div className="durationText">
            {this.state.nowPlayingID
              ? this.toTime(this.audio.currentTime - this.audioOffset) +
                " / " +
                this.toTime(this.audio.duration - this.audioOffset)
              : "-:-- / -:--"}
          </div>
        </div>
        <div
          className="progress"
          onMouseDown={(e) => {
            if (e.target.getAttribute("class")) {
              if (
                e.target.getAttribute("class").match(/progressPoint/) ||
                e.target.getAttribute("class").match(/progressBar/)
              ) {
                this.setState({
                  dragging: true,
                });
              }
            }
          }}
        >
          <div
            className="progressBar"
            style={{
              width: `${this.state.nowPlayingID && this.state.progress * 100}%`,
            }}
          />
          <div
            className="pre_progressBar"
            style={{
              width: `${
                this.state.nowPlayingID && (1 - this.state.progress) * 100
              }%`,
            }}
          />
          {this.state.nowPlayingID ? (
            <div
              className="progressPoint"
              style={{
                left: `calc(${
                  this.state.progress * 100
                }% - calc(var(--progress-point) / 2))`,
              }}
            />
          ) : (
            <div />
          )}
        </div>
      </div>
    );
  }
}
