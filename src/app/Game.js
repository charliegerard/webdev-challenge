"use client";
import { useEffect, useState } from "react";

import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import useMeasure from "react-use-measure";

import * as tfjsWasm from "@tensorflow/tfjs-backend-wasm";
import * as tf from "@tensorflow/tfjs-core";

import { Model } from "./model";

import styles from "./styles.module.css";

tfjsWasm.setWasmPaths(
  `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${tfjsWasm.version_wasm}/dist/`
);

import * as poseDetection from "@tensorflow-models/pose-detection";

const videoWidth = 1200;
const videoHeight = 700;
let video;

export const Game = ({ present }) => {
  const [rightWristXPosition, setRightWristXPosition] = useState(0);
  //   const [leftWristXPosition, setLeftWristXPosition] = useState(0);
  const [rightWristYPosition, setRightWristYPosition] = useState(0);
  //   const [leftWristYPosition, setLeftWristYPosition] = useState(0);
  const [detectionStarted, setDetectionStarted] = useState(false);
  const [toyReady, setToyReady] = useState(false);

  const firstLetter = present.charAt(0);

  const firstLetterCap = firstLetter.toUpperCase();

  const remainingLetters = present.slice(1);

  const capitalizedWord = firstLetterCap + remainingLetters;

  const [ref, bounds] = useMeasure();
  const ratio = bounds.height / bounds.width;

  const frustum = 800;
  const horizonal = ratio < 1 ? frustum / ratio : frustum;
  const vertical = ratio < 1 ? frustum : frustum * ratio;

  useEffect(() => {
    const setup = async () => {
      video = await setupCamera();

      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet
      );

      detectMovements(detector);
    };

    setup();
    tf.ready();
    setDetectionStarted(true);
  }, []);

  const detectMovements = async (detector) => {
    const poseDetection = async () => {
      const poses = await detector.estimatePoses(video);

      if (poses.length) {
        const rightWrist = poses[0].keypoints.filter(
          (k) => k.name === "right_wrist"
        )[0];

        // const leftWrist = poses[0].keypoints.filter(
        //   (k) => k.name === "left_wrist"
        // )[0];
        if (rightWrist.score > 0.3) {
          const xPos = window.innerWidth - rightWrist.x;
          const yPos = rightWrist.y;
          setRightWristXPosition(xPos);
          setRightWristYPosition(yPos);
        }

        // if (leftWrist.score > 0.3) {
        //   const xPos = window.innerWidth - leftWrist.x;
        //   const yPos = leftWrist.y;
        //   setLeftWristXPosition(xPos);
        //   setLeftWristYPosition(yPos);
        // }
      }

      requestAnimationFrame(poseDetection);
    };
    poseDetection();
  };

  async function setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        "Browser API navigator.mediaDevices.getUserMedia not available"
      );
    }

    const video = document.getElementById("video");
    video.width = videoWidth;
    video.height = videoHeight;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: videoWidth,
        height: videoHeight,
      },
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
      video.onloadedmetadata = () => resolve(video);
    });
  }

  return (
    <main className={`${styles.game}`}>
      <section>
        <video id="video" className={`${styles.video}`} autoPlay></video>
      </section>
      <Canvas ref={ref} orthographic>
        <OrthographicCamera
          makeDefault
          position={[0, 0, 2]}
          top={vertical}
          bottom={-vertical}
          left={-horizonal}
          right={horizonal}
          zoom={300}
          manual
        />
        <ambientLight intensity={Math.PI} />
        <spotLight intensity={Math.PI} position={[10, 10, 10]} angle={0.15} />
        <pointLight intensity={Math.PI} />

        <Model
          position={[0, 4, 0]}
          // url={`/static/${capitalizedWord}.fbx`}
          url="/static/Pony.fbx"
          //   position={[-horizonal / 500, 3, 0]}
          mouseXPos={rightWristXPosition}
          mouseYPos={rightWristYPosition}
          detectionStarted={detectionStarted}
          setToyReady={setToyReady}
        />

        <Model
          url="/static/Present.fbx"
          position={[0, -5, 0]}
          scale={4}
          //   position={[-horizonal / 500, 3, 0]}
          mouseXPos={0}
          mouseYPos={0}
          detectionStarted={false}
          toyReady={false}
          type="present"
          clone={true}
        />
      </Canvas>

      <div
        className={`${styles.righthand}`}
        style={{
          left: `${rightWristXPosition}px`,
          top: `${rightWristYPosition}px`,
        }}
      ></div>

      {/* <div
        className={`${styles.lefthand}`}
        style={{
          left: `${leftWristXPosition}px`,
          top: `${leftWristYPosition}px`,
        }}
      ></div> */}
    </main>
  );
};
