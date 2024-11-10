"use client";
import { useEffect, useState } from "react";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import styles from "./page.module.css";

let context, canvas, video, image, chat;

const schema = {
  description: "Present details",
  type: SchemaType.OBJECT,
  properties: {
    firstname: {
      type: SchemaType.STRING,
      description: "Child's first name",
      nullable: false,
    },
    lastname: {
      type: SchemaType.STRING,
      description: "Child's last name",
      nullable: false,
    },
    present: {
      type: SchemaType.STRING,
      description: "Child's present",
      nullable: false,
    },
  },
  required: ["firstname", "lastname", "present"],
};

export default function Home() {
  useEffect(() => {
    navigator.getUserMedia(
      {
        audio: false,
        video: { width: 800, height: 500 },
      },
      (stream) => {
        const video = document.querySelector("video");
        video.srcObject = stream;
        video.onloadedmetadata = (e) => {
          video.play();
        };
      },
      (err) => {
        console.error(`The following error occurred: ${err.name}`);
      }
    );

    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    video = document.getElementById("webcam");
  }, []);

  useEffect(() => {
    const genAI = new GoogleGenerativeAI(
      process.env.NEXT_PUBLIC_GEMINI_API_KEY
    );
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema: schema,
    };

    chat = model.startChat({
      history: [],
      generationConfig,
    });
  }, []);

  const takePicture = async () => {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataURL = canvas.toDataURL("image/jpeg");
    const imageFile = new File([dataURIToBlob(imageDataURL)], "image.jpg", {
      type: "image/jpeg",
    });
    image = await fileToGenerativePart(imageFile);

    try {
      const prompt = `This is a picture of a letter to Santa. Extract the first name, last name and present.`;

      const res = await chat.sendMessage([prompt, image]);

      try {
        const { firstname, lastname, present } = JSON.parse(
          res.response.text()
        );

        await uploadPresent(firstname, lastname, present);
      } catch (e) {
        console.log(e);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const uploadPresent = async (firstname, lastname, present) => {
    const res = await fetch(
      `https://${process.env.NEXT_PUBLIC_SANITY_SITE_ID}.api.sanity.io/v1/data/mutate/production`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SANITY_TOKEN}`,
        },
        body: JSON.stringify({
          mutations: [
            {
              create: {
                _type: "post",
                firstname,
                lastname,
                present,
              },
            },
          ],
        }),
      }
    );

    const data = await res.json();
    // console.log(data);
  };

  return (
    <main className={`${styles.main}`}>
      <div className={`${styles.snowflakes}`} aria-hidden="true">
        <div className={`${styles.snowflake}`}>❅</div>
        <div className={`${styles.snowflake}`}>❅</div>
        <div className={`${styles.snowflake}`}>❆</div>
        <div className={`${styles.snowflake}`}>❄</div>
        <div className={`${styles.snowflake}`}>❅</div>
        <div className={`${styles.snowflake}`}>❆</div>
        <div className={`${styles.snowflake}`}>❄</div>
        <div className={`${styles.snowflake}`}>❅</div>
        <div className={`${styles.snowflake}`}>❆</div>
        <div className={`${styles.snowflake}`}>❄</div>
      </div>

      <h1>Santa's AI</h1>
      <section className={`${styles.container}`}>
        <p>Take a picture of your letter to Santa!</p>
        <canvas
          id="canvas"
          width="640"
          height="480"
          style={{ display: "none" }}
        ></canvas>
        <video id="webcam" autoPlay></video>
        <section className={`${styles.buttonSection}`}>
          <button onClick={takePicture}>Take picture</button>
        </section>
      </section>
    </main>
  );
}

const dataURIToBlob = (dataURI) => {
  const byteString = atob(dataURI.split(",")[1]);
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  return new Blob([arrayBuffer], { type: mimeString });
};

async function fileToGenerativePart(file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
}
