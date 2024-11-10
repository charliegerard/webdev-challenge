"use client";
import { useFBX } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Raycaster, Vector3, Vector2 } from "three";
import useSound from "use-sound";

export const Model = ({
  url,
  mouseXPos,
  mouseYPos,
  position,
  detectionStarted,
  setToyReady = false,
  toyReady,
  type = "",
  clone,
  scale = 0.002,
}) => {
  const [isTouched, setIsTouched] = useState(false);
  const obj = useFBX(url);

  const meshRef = useRef();

  const [play] = useSound("/static/hohoho.mp3");

  useFrame((state, delta) => {
    // if (type === "present") {
    //   meshRef.current.visible = false;
    // }

    meshRef.current.rotation.y += delta;
    meshRef.current.rotation.z += delta;

    if (detectionStarted) {
      if (meshRef.current.position.y > -5) {
        meshRef.current.position.y -= delta * 0.5;
      }
    }
  });

  useFrame((state) => {
    const raycaster = new Raycaster();
    const mouse = new Vector2();

    // Normalize mouse coordinates
    mouse.x = (mouseXPos / window.innerWidth) * 2 - 1;
    mouse.y = -(mouseYPos / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, state.camera);

    const intersects = raycaster.intersectObjects(state.scene.children);

    if (
      intersects.length > 0 &&
      intersects[0].object === meshRef.current.children[0] &&
      detectionStarted &&
      !isTouched
    ) {
      setIsTouched(true);
      setToyReady(true);
      // if (type === "") {
      // meshRef.current.visible = !meshRef.current.visible;
      // } else {
      meshRef.current.visible = false;
      // }

      // if (type === "present") {
      //   console.log("not here??");
      //   meshRef.current.position.y = 0;
      // }

      play();
    }
  });

  return (
    <primitive
      ref={meshRef}
      object={clone ? obj.clone() : obj}
      position={position}
      rotation={[0, 0, 0]}
      scale={scale}
    />
  );
};
