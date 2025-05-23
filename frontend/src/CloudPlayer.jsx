import React, { useState, useEffect, useContext } from "react";
import vSynthProcessor from "./vSynthProcessor";
import loadVideos from "./loadVideos";
import CloudContext from "./CloudContext";
// import './CloudPlayer.css'

const CloudPlayer = () => {
    const { clouds } = useContext(CloudContext)
    // const [currentCloud, setCurrentCloud] = useState(0)
    // const [clouds, setClouds] = useState()

    let cloudVid
    const randomVidOnLoad = `/cloud-set/${clouds[Math.floor(Math.random() * clouds.length)]}` // random GOES movie on load

    if (clouds) {
      cloudVid = (
            <video id='cloud-video-element' 
              autoPlay 
              muted 
              loop    
              play
              width={2000}
              height={2000}  
              src={randomVidOnLoad}              
            >
              {/* { clouds.map(cloud => {
                return ( <source src='tbd.mp4' type="video/mp4" /> )                 
              }) } */}
            </video>
      )
  }

    return (
        <div>
            { cloudVid }

            <div id='cloud-player-container' class='cloud-flexbox'>
                <canvas id="cloud-player"
                  width={2000}
                  height={2000}
                  />
            </div>
            
            { loadVideos(clouds) }
        </div>
    )
}

export default CloudPlayer