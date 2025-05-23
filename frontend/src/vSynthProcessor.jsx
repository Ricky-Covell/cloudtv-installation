import React, { useState, useEffect, useContext } from "react";
import vSynthLfo from "./vSynthLfo";
import CloudContext from "./CloudContext";
import MidiFighterTwister from "./MidiFighterTwister";
import vSynthOptions from "./vSynthOptions";

// MAY 12 SHORTLIST
  // hide mouse

  //        R INV   | G INV    | B INV      | HUE ROTATE
  //        FOLD I  | FOLD II  | BRIGHTNESS | CONTRAST
  //        PINCH   | SCAN     | PRISM I    | PRISM II 
  //        SPEED   |          | vidSELECT  | 



const vSynthProcessor = () => {
  // const isLoaded = false

  setTimeout(() => {vSynth()}, 50);         // Temporary fix because listening for DOMContentLoaded wasn't working?
  
  const { clouds } = useContext(CloudContext);
  const { vSynthClock, downsampleFactor, playerHeight, playerWidth, playerNudge, willReadFrequentlyFlag, alphaFlag, desynchronizedFlag} = vSynthOptions
  const vSynth = () => {
    // // // // // // // // // ELEMENTS // // // // // // // // // // // // // // // 
    const vPlayer = document.getElementById('cloud-player')
    vPlayer.style.width=`${playerHeight}vw`
    vPlayer.style.height=`${playerWidth}vh`
    vPlayer.style.marginLeft=`${playerNudge}%`

    const canvas = document.getElementById('cloud-player');
    const video = document.getElementById('cloud-video-element');
    const cloudsetLength = clouds.length - 1
    document.body.style.cursor = 'none'

    let canvasInterval = null;
    let ctx = canvas.getContext('2d', { 
      alpha: alphaFlag, 
      willReadFrequently: willReadFrequentlyFlag, 
      desynchronized: desynchronizedFlag 
    })
    
    // // // // // // // // // MIDI FIGHTER TWISTER // // // // // // // // // // // // // // // 
    const MFT = new MidiFighterTwister()
    let paramSliderArray;

    // // // // // // // // // // // // // // PARAMETERS // // // // // // // // // // // // 

        const speedSlider = document.getElementById('param-speed')
        const fpsSlider = document.getElementById('param-fps')
        const cloudSlider = document.getElementById('param-cloud')
        const resSlider = document.getElementById('param-resolution')
        
        video.playbackRate = 1
        
    let prism1Val=0, 
        prism2Val=0, 
        brightVal=25, 
        contrastVal=0, 
        postbrightVal=25, 
        postcontrastVal=0, 
        convVal=0, 
        rInv=0,
        gInv=0,
        bInv=0,
        hueRotate=0,
        cloudFold1Val=0,
        cloudFold2Val=0,
        colorInv3Val=0,
        wPinchVal=1, 
        wScanVal=1,
        p12Val=1, 
        p13Val=1,
        pbSelectVal //also affects Prism2() to create more dramatic shifts during video swap
        

    // MFT AGAIN 
    const MFTtoRange = (val, inMin, inMax, outMin, outMax) => {
      return (val - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }
    
    const MFTupdate = () => {
    
      rInv  = MFTtoRange(MFT.inputArray[0], 0, 127, 0, 1)
      gInv  = MFTtoRange(MFT.inputArray[1], 0, 127, 0, 1)
      bInv  = MFTtoRange(MFT.inputArray[2], 0, 127, 0, 1)
      hueRotate = MFT.inputArray[3]*3
        
        
      cloudFold1Val  = MFTtoRange(MFT.inputArray[4], 0, 127, 0, 10)
      cloudFold2Val  = MFTtoRange(MFT.inputArray[5], 0, 127, 0, 12)
      // convVal  = MFTtoRange(MFT.inputArray[5], 0, 127, 0, 5)
      postbrightVal  = MFTtoRange(MFT.inputArray[6], 0, 127, 0, 35)
      postcontrastVal  = MFTtoRange(MFT.inputArray[7], 0, 127, -50, 200)        

      wPinchVal = MFTtoRange(MFT.inputArray[8], 0, 127, 1, 10)
      wScanVal = MFTtoRange(MFT.inputArray[9], 0, 127, 0, 3)
      // prism1Val  = MFTtoRange(MFT.inputArray[10], 0, 127, 0, 10111)
      prism1Val  = MFTtoRange(MFT.inputArray[10], 0, 127, 0, 1011)
      prism2Val  = MFTtoRange(MFT.inputArray[11], 0, 127, 0, 30000)

      video.playbackRate = MFTtoRange(MFT.inputArray[12], 0, 127, 1, 10)      
      pbSelectVal = Math.floor(MFTtoRange(MFT.inputArray[14], 0, 127, 0, cloudsetLength))

      // 'change' listener for pbSelection
      if (video.src !== `http://localhost:3000/cloud-set/${clouds[pbSelectVal]}`) {
        video.src =     `/cloud-set/${clouds[pbSelectVal]}`        
        video.play()
      }

    }

    const MFTdebounce = (update, delay) => {
      let timeout;
      return function () {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
              update()
          }, delay);
      }
    }

    MFT.setUpdate(MFTdebounce(MFTupdate, 1))
    
    // // // // // // // // // PROCESSORS // // // // // // // // // // // // // // // 
    const drawOriginal = () => {
      ctx.drawImage(video, 0, 0, ctx.canvas.width,ctx.canvas.height);
    }

    const BRIGHTNESS = (data, limit) => {
      if (brightVal == 50) return

      for (let i = 0; i < limit; i+=4) {
        data[i]   += ((255 * (brightVal / 100)) - 50);
        data[i+1] += ((255 * (brightVal / 100)) - 50);
        data[i+2] += ((255 * (brightVal / 100)) - 50);
      }
    }

    
    // let contrastFactor = (259.0 * (contrast + 255.0)) / (255.0 * (259.0 - contrast));
    const POSTCONTRAST = (data, limit) => {
      // if (p5Val == 0) return

      for (var i = 0; i < limit; i+= 4) { 
        data[i+0] = Math.ceil(259.0 * (postcontrastVal + 255.0) / (255.0 * (259.0 - postcontrastVal)) * (data[i+0] - 128.0) + 128.0)
        data[i+1] = Math.ceil(259.0 * (postcontrastVal + 255.0) / (255.0 * (259.0 - postcontrastVal)) * (data[i+1] - 128.0) + 128.0)
        data[i+2] = Math.ceil(259.0 * (postcontrastVal + 255.0) / (255.0 * (259.0 - postcontrastVal)) * (data[i+2] - 128.0) + 128.0) 
        // data[i+3] = Math.ceil(259.0 * (postcontrastVal + 255.0) / (255.0 * (259.0 - postcontrastVal)) * (data[i+3] - 128.0) + 128.0)
      }
    }

    const POSTBRIGHTNESS = (data, limit) => {
      // if (postbrightVal == 50) return

      for (let i = 0; i < limit; i+=4) {
        data[i]   += ((255 * (postbrightVal / 100)) - 50);
        data[i+1] += ((255 * (postbrightVal / 100)) - 50);
        data[i+2] += ((255 * (postbrightVal / 100)) - 50);
      }
    }

    
    // let contrastFactor = (259.0 * (contrast + 255.0)) / (255.0 * (259.0 - contrast));
    const CONTRAST = (data, limit) => {
      // if (p5Val == 0) return

      for (var i = 0; i < limit; i+= 4) { 
        data[i+0] = (Math.floor(259.0 * (contrastVal + 255.0) / (255.0 * (259.0 - contrastVal)) * (data[i+0] - 128.0) + 128.0))
        data[i+1] = (Math.floor(259.0 * (contrastVal + 255.0) / (255.0 * (259.0 - contrastVal)) * (data[i+1] - 128.0) + 128.0))
        data[i+2] = (Math.floor(259.0 * (contrastVal + 255.0) / (255.0 * (259.0 - contrastVal)) * (data[i+2] - 128.0) + 128.0) )
        // data[i+3] = Math.ceil(259.0 * (p5Val + 255.0) / (255.0 * (259.0 - p5Val)) * (data[i+3] - 128.0) + 128.0)
      }
    }

    const PRISM1 = (data, limit) => {      
      if (prism2Val != 0) {
        for (let i = 0; i < limit; i+=4) {
          data[i+0] =  data[(Math.round(i+(0*pbSelectVal)+(prism2Val*4)+1300)) % limit]   // red
          data[i+1] =  data[(Math.round(i+(1*pbSelectVal)+(prism2Val*5)+300)) % limit]   // green
          data[i+2] =  data[(Math.round(i+(2*pbSelectVal)+(prism2Val*6)+580)) % limit]   // blue
          data[i+3] =  data[(Math.round(i+(3*pbSelectVal)+(prism2Val*9)+3000)) % limit] 
        }
      }
      }

      const PRISM3 = (data, limit) => {
        if (prism2Val == 0) return
        
        if (prism2Val != 0) {
          for (let i = 0; i < limit; i+=4) {
            data[i+0] =  data[(Math.round(i+0+(prism2Val*4)+1300)) % limit]   // red
            data[i+1] =  data[(Math.round(i+1+(prism2Val*5)+300)) % limit]   // green
            data[i+2] =  data[(Math.round(i+2+(prism2Val*6)+580)) % limit]   // blue
            data[i+3] =  data[(Math.round(i+3+(prism2Val*9)+3000)) % limit] 
          }
        }
        }  

    const PRISM2 = (data, limit) => {
      if (prism1Val == 0) return
        for (let i = 0; i < limit; i+=4) {
          data[(i+0*(Math.round(prism1Val*(pbSelectVal*.2)*.231)) % limit)] = data[i+(0)]   
          data[(i+1*(Math.round(prism1Val*(pbSelectVal*.3)*.213)) % limit)] = data[i+(1)] 
          data[(i+2*(Math.round(prism1Val*(pbSelectVal*.4)*.221)) % limit)] = data[i+(2)] 
          data[(i+3*(Math.round(prism1Val*(pbSelectVal*.5)*.247)) % limit)] = data[i+(3)]  
        }
    }

    

    const EMBOSS1 = (data, limit, w) => {
      if (colorInv3Val == 0) return 
        for(var i = 0; i < limit; i+=3) {                
          data[i] = Math.round((((100 + 2*data[i] - data[i+4] - data[(i-colorInv3Val) + w*4]) + (data[i]*7))));          
        }
    }

    const EMBOSS2 = (data, limit, w) => {        
      if (colorInv3Val == 0) return 
       for(var i = 0; i < limit; i+=4) {        
          data[i] = (Math.round(colorInv3Val/.5)-50) + 2*data[i] - data[i] - data[i + w*4];          
          data[i+3] = (Math.round(colorInv3Val/.5)-50) + 2*data[i+2] - data[i+2] - data[Math.round((i+2) + (w*3.97))];          
          data[i+1] = (Math.round(colorInv3Val/.5)-50) + 2*data[i+1] - data[i+1] - data[i+1 + w*4];          
      }

    // for(var i = 0; i < limit; i+=4) {        
    //     // if (data[i]<p2Val)
    //     data[Math.round(i)] =   (Math.round(p1Val/.5)-50) + 2*data[Math.round(i+0)] - data[Math.round(i+0)] - data[Math.round(i+0 + w*4)];          
    //     data[Math.round(i+2)] = (Math.round(p2Val/.5)-50) + 2*data[Math.round(i+2)] - data[Math.round(i+2)] - data[Math.round((i+2) + (w*3.97))];          
    //     data[Math.round(i+4)] = (Math.round(p1Val/.5)-50) + 2*data[Math.round(i+1)] - data[Math.round(i+1)] - data[Math.round(i+1 + w*4)];          
    //  }
    }

    const PRICONV = (data, limit, h) => {   
      let nuHeight=h/3

      for(var i = 0; i < limit; i+=4) {        
       // if (data[i]<p2Val)
         data[i] = (Math.round(p1Val/.5)-50) + 2*data[i] - data[i] - data[i + nuHeight*4];          
         data[i+3] = (Math.round(p2Val/.5)-50) + 2*data[i+2] - data[i+2] - data[Math.round((i+2) + (nuHeight*3.97))];          
         data[i+1] = (Math.round(p1Val/.5)-50) + 2*data[i+1] - data[i+1] - data[i+1 + nuHeight*4];          
     }

      for(var i = 0; i < limit; i+=4) {        
        // if (data[i]<p2Val)
          data[Math.round(i)] =   (Math.round(p1Val/.5)-50) + 2*data[Math.round(i+0)] - data[Math.round(i+0)] - data[Math.round(i+0 + nuHeight*4)];          
          data[Math.round(i+2)] = (Math.round(p2Val/.5)-50) + 2*data[Math.round(i+2)] - data[Math.round(i+2)] - data[Math.round((i+2) + (nuHeight*3.97))];          
          data[Math.round(i+4)] = (Math.round(p1Val/.5)-50) + 2*data[Math.round(i+1)] - data[Math.round(i+1)] - data[Math.round(i+1 + nuHeight*4)];          
      }
    }

    const CLOUDFOLDER1 = (data, limit) => {
      if (cloudFold1Val == 0) return

      if (cloudFold1Val > 0) {
        let r = ((cloudFold1Val)      )
        let g = ((cloudFold1Val * .35))
        let b = ((cloudFold1Val * .77))
  
        // interpolating between full inversion value and original, per color channel
        for (let i = 0; i < limit; i += 8) {        
          data[i]   = 255 % (((  data[i] * (1 - r) + (255 - data[i]) * r)))
          data[i+1] = 255 % (((data[i+1] * (1 - g) + (255 - data[i+1]) * g)))
          data[i+2] = 255 % (((data[i+2] * (1 - b) + (255 - data[i+2]) * b)))
          // data[i+2] += 50 
        }
      }
    }

    const CLOUDFOLDER2 = (data, limit) => {
      if (cloudFold2Val == 0) return
      
      let r = (((cloudFold2Val) * .12))
      let g = (((cloudFold2Val) * .23))
      let b = (((cloudFold2Val) * .41))

      if (cloudFold2Val > 0) {
        for (let i = 0; i < limit; i +=4) {        
          data[i+0] = 255 % (((data[i] * (1 - r) + (255 - data[i]) * b)))
          data[i+1] = 255 % (((data[i+1] * (1 - g) + (255 - data[i+1]) * r)))
          data[i+2] = 255 % (((data[i+2] * (1 - b) + (255 - data[i+2]) * g)))

        }
      }
    }

    const ALPHAFOLD = (data, limit) => {
      if (colorInv3Val == 0) return

        // interpolating between full inversion value and original, per color channel
        for (let i = 0; i < limit; i += 4) {        
          data[i+3] = 255 % (Math.round(data[i+3] * (1 - colorInv3Val) + (255 - data[i+3]) * colorInv3Val))    
          // data[i+7] = 255 % (Math.round(data[i+4] * (1 - colorInv3Val) + (255 - data[i+2]) * (colorInv3Val)))    
        }

        // for (let i = 0; i < limit; i += 4) {        
        //   data[i+3] = 255 % (Math.round(data[i+7] * (1 - colorInv3Val) + (255 - data[i+7]) * colorInv3Val))    
        //   // data[i+7] = 255 % (Math.round(data[i+4] * (1 - colorInv3Val) + (255 - data[i+2]) * (colorInv3Val)))    
        // }
      }
    

    const ACCIDENTVERTICALGLITCHTHING = (data, limit) => {
      if (colorInv2Val == 0) return
      
      let r = colorInv2Val * 1.57
      let g = colorInv2Val * 1.04
      let b = colorInv2Val * 1.92

      if (colorInv2Val > 0) {
        for (let i = 0; i < limit; i +=4) {        
          data[(Math.round(limit/(colorInv2Val)))%(i+0)] = 255%  (Math.round(data[i] * (1 - r) + (255 - data[i]) * b))     
          data[(Math.round(limit/(colorInv2Val)))%(i+1)] = 255%  (Math.round(data[i+1] * (1 - r) + (255 - data[i+1]) * g)) 
          data[(Math.round(limit/(colorInv2Val)))%(i+2)] = 255%  (Math.round(data[i+2] * (1 - b) + (255 - data[i+2]) * b)) 
        }
      }
    }

    const INVERT = (data, limit) => {
      // if (Inv1Val == 0 && Inv2Val == 0) return
      // let spread = Inv2Val*2
      // // let aInv = 0

      // if (Inv1Val > 0) rInv = Inv1Val
      // if (Inv1Val < 0) bInv = Inv1Val
      // gInv = Inv2Val
      
      
      // interpolating between full inversion value and original, per color channel
      for (let i = 0; i < limit; i += 4) {        
        data[i] = Math.round(data[i] * (1 - rInv) + (255 - data[i]) * rInv) 
        data[i+1] = Math.round(data[i+1] * (1 - gInv) + (255 - data[i+1]) * gInv)
        data[i+2] = Math.round(data[i+2] * (1 - bInv) + (255 - data[i+2]) * bInv)      
        // data[i+3] = Math.round(data[i+3] * (1 - aInv) + (255 - data[i+3]) * aInv)      
      }
    };

    const CLOUDFOLDER3 = (data, limit) => {
      if (colorInv3Val == 0) return

      if (colorInv3Val > 0) {
        let r = colorInv3Val
        let g = colorInv3Val * .35
        let b = colorInv3Val * .77
  
        // interpolating between full inversion value and original, per color channel
        for (let i = 0; i < limit; i +=  2) {        
          data[i] = 255 % (Math.round(data[i] * (1 - r) + (255 - data[i]) * r))
          data[i+1] = 255 % (Math.round(data[i+1] * (1 - g) + (255 - data[i+1]) * g)) 
          data[i+2] = 255 % (Math.round(data[i+2] * (1 - b) + (255 - data[i+2]) * b))
          // data[i+2] += 50 
        }

      }
    }


    const DOWNSAMPLE = () => {
      canvas.width  = 2000 / downsampleFactor
      canvas.height = 2000 / downsampleFactor
    }

    const WIDTHGLITCH = () => {
      // if (p9Val === 1) return  1

      return wPinchVal
    }

    const WIDTHSCAN = () => {
      // if (p9Val === 1) return  1

      return wScanVal
    }

    // const ALPHAMODE = () => {
    //   if (alphaIO > 0.5) {
    //     ctx = canvas.getContext('2d', { 
    //       alpha: true, 
    //       willReadFrequently: false, 
    //       desynchronized: true 
    //     })

    //     alphaNow = true
    //   }

    //   else if (alphaIO <= 0.5) {
    //     ctx = canvas.getContext('2d', { 
    //       alpha: false, 
    //       willReadFrequently: false, 
    //       desynchronized: true 
    //     })

    //     alphaNow = false
    //   }

    //   console.log('ALPHA')
    // }

    const CONVOLUTION = (data, limit, w, h, kernel) => {
        if (convVal == 0) return

        const k1 = [
          1, 0, -1,
          2, 0, -2,
          1, 0, -1
        ];
    
        const k2 = [
          -1, -1, -1,
          -1, 8, -1,
          -1, -1, -1
        ];

        const sharpen = [
           2,  0,  0,
           0, -1,  0,
           0,  0, -1
        ]


        const emboss2= [
          0,  (convVal*3),  0,
          0, -2,  0,
          (convVal),  (convVal*-3), 0
       ]
      
    
        kernel = emboss2;
    
    
        const dim = Math.sqrt(kernel.length);
        const pad = Math.floor(dim / 2);
    
        const pixels = data
    
        if (dim % 2 !== 1) {
          console.log('Invalid kernel dimension');
        }
    
    
    
        let pix, i, r, g, b;
        const cw = (w + pad * 2) - 2; // add padding
        const ch = h + pad * 2;
    
        for (let row = 0; row < h; row++) {
          for (let col = 0; col < w; col++) {
    
            r = 0;
            g = 0;
            b = 0;
    
    
            for (let kx = -pad; kx <= pad; kx++) {
              for (let ky = -pad; ky <= pad; ky++) {
    
                i = (ky + pad) * dim + (kx + pad); // kernel index
                pix = 4 * ((row + ky) * cw + (col + kx)); // image index
                r += pixels[pix++] * kernel[i];
                g += pixels[pix++] * kernel[i];
                b += pixels[pix  ] * kernel[i];
              }
            }
    
            pix = 4 * ((row - pad) * w + (col - pad)); // destination index
            pixels[pix++] = r;
            pixels[pix++] = g;
            pixels[pix++] = b;
            pixels[pix  ] = 255; // we want opaque image
    
          }
        }
    
        // ctx.putImageData(pixels,0,0);
    
    }
    // // // // // // // // // EXECUTE // // // // // // // // // // // // // // // 
    const draw = () => {      
      ctx.filter = `hue-rotate(${hueRotate}deg)`
      ctx.drawImage(video,WIDTHSCAN()*100,0,(ctx.canvas.width/WIDTHGLITCH() ),(ctx.canvas.height));
      let idata = ctx.getImageData(0,0,canvas.width, canvas.height);
      let data = idata.data;
      let w = idata.width;
      let h = idata.height;
      let limit = data.length
      
      CLOUDFOLDER2(data,limit)    
      PRISM1(data, limit)
      PRISM2(data, limit) 
      CLOUDFOLDER1(data,limit)
      INVERT(data, limit)
      POSTBRIGHTNESS(data,limit)
      POSTCONTRAST(data,limit)
      
      
      
      ctx.putImageData(idata,0,0);
    }
    
    canvasInterval = window.setInterval(() => {
      // drawOriginal()
      // requestAnimationFrame(draw)
      draw()   
      // PRISMcheck()
    }, vSynthClock);
    DOWNSAMPLE()    
  } 


  // window.onload = (evt) => {vSynth}

  // addEventListener('load', (evt)=>{
  //   vSynth()
  // })
} 

export default vSynthProcessor




// clearInterval(canvasInterval);
  // canvasInterval = window.setInterval(() => {
    // drawOriginal()
    // draw()
// }, );

// video.onpause = function() {
  //   clearInterval(canvasInterval);
    // };
    // video.onended = function() {
    //   clearInterval(canvasInterval);
    // };
    

