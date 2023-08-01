import React, { useState, Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { Bars3Icon, ChevronDownIcon } from "@heroicons/react/20/solid";

import { FFmpeg } from "@ffmpeg/ffmpeg";

import BG from "./assets/background.png";

// register voice - 1
import BoxRegister1 from "./assets/box-register-voice-1.png";
import IconRegister1 from "./assets/mic-green.png";

// register voice - 2
import BoxRegister2 from "./assets/box-register-voice-2.png";
import IconRegister2 from "./assets/stop-green.png";

// register voice - 3
import BoxRegister3 from "./assets/box-register-voice-3.png";
import IconRegister3 from "./assets/check-green.png";

// test voice - 1
import BoxTest1 from "./assets/box-test-voice-1.png";
import IconTest1 from "./assets/mic-purple.png";

// test voice - 2
import BoxTest2 from "./assets/box-test-voice-2.png";
import IconTest2 from "./assets/stop-purple.png";

// test voice - 3
import BoxTest3 from "./assets/box-test-voice-3.png";

// test voice - 4.1 - no problem
import BoxTestNoProblem from "./assets/box-no-problem.png";

// test voice - 4.2 - hacker
import BoxTestHacker from "./assets/box-hacker.png";

import Deployment from "./contract-deployment.json";

import "./App.css";
import invariant from "tiny-invariant";
import { ethers } from "ethers";
import { Verifier, Verifier__factory } from "./typechain-types";

const NetworkNames = Object.keys(Deployment);

const HardhatNetwork = Deployment["hardhat"];

type DeploymentDetail = (typeof Deployment)[keyof typeof Deployment];

const PROD = process.env.NODE_ENV === "production";
const API_PATH = PROD ? "/api/auth" : "/mock-api/auth";

const ffmpeg = new FFmpeg();

const containerStyle = {
  width: "100vw",
  height: "100vh",
  backgroundColor: "#2a275e",
};

const backgroundStyle = {
  width: "100vw",
  height: "100vh",
};

const boxStyle = {
  position: "absolute" as "absolute",
  width: "25.2344vw",
  height: "55.1683vh",
  left: "16.3281vw",
  top: "22.3558vh",
};

const defaultButtonStyle = {
  position: "absolute" as "absolute",
  width: "5.4531vw",
  height: "8.651vh",
  left: "26.2vw",
  top: "61.3vh",
  cursor: "pointer",
};

class RecordHandler {
  private stream?: MediaStream;
  private recorder?: MediaRecorder;
  private data: Blob[] = [];

  private blob?: Blob;

  static async start(): Promise<RecordHandler> {
    const handler = new RecordHandler();
    await handler.start();
    return handler;
  }

  async start(): Promise<void> {
    invariant(!this.blob, "blob should be undefined");

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });

    this.recorder = new MediaRecorder(this.stream);

    this.recorder.ondataavailable = (event: any) => this.data.push(event.data);
    this.recorder.start();
  }

  // return webm blob
  async stop(): Promise<Blob> {
    if (this.blob) return this.blob;

    invariant(this.recorder !== undefined, "recorder should not be undefined");
    invariant(this.stream !== undefined, "stream should not be undefined");

    const webmBlobP = new Promise<Blob>((resolve) => {
      this.recorder!.onstop = () => {
        const webmBlob = new Blob(this.data, { type: "audio/webm" });
        console.log("webm blob generated: size: %d", webmBlob.size);
        invariant(webmBlob.size > 0, "invalid webm blob size");
        resolve(webmBlob);
      };

      if (this.recorder!.state === "recording") this.recorder!.stop();
      this.stream!.getTracks().forEach((track) => track.stop());
    });

    return webmBlobP;
  }
}

/**
 * @dev This function converts a webm blob into wav blob with the help of ffmpeg.wasm
 */
async function convertWebmToWav(webmBlob: Blob): Promise<Blob> {
  if (!ffmpeg.loaded) {
    await ffmpeg.load({
      coreURL: "/ffmpeg-core.js",
      wasmURL: "/ffmpeg-core.wasm",
    });
  }

  const inputName = "input.webm";
  const downloadFileExtension = "wav";
  const outputName = `output.${downloadFileExtension}`;

  await ffmpeg.writeFile(inputName, new Uint8Array(await webmBlob.arrayBuffer()));
  await ffmpeg.exec(["-i", inputName, outputName]);

  const outputData = await ffmpeg.readFile(outputName);
  const outputBlob = new Blob([outputData], {
    type: `audio/${downloadFileExtension}`,
  });

  return outputBlob;
}

function App() {
  // hakcer's voice wav
  const [hackerBlob, setHackerBlob] = useState<Blob | null>(null);

  // user's voice wav
  const [userBlob, setUserBlob] = useState<Blob | null>(null);

  // media recording state
  const [recordHandler, setRecordHandler] = useState<RecordHandler | null>(null);

  // metamask login state
  const [metamaskState, setMetamaskState] = useState<{
    network: string;
    account: string;
    signer: ethers.Signer;
    deployment: DeploymentDetail;
    contracts: {
      Verifier: Verifier;
    };
  } | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("hardhat");

  const connectMetamask = async (network: string) => {
    const ethereum: any = (window as any).ethereum;
    const newProvider = new ethers.BrowserProvider(ethereum as any);
    await newProvider.send("eth_requestAccounts", []);

    const deployment: DeploymentDetail = Deployment[network as keyof typeof Deployment];

    const chainIdHex = "0x" + BigInt(deployment.chainId).toString(16);

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchErr: any) {
      if (switchErr.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: chainIdHex,
                chainName: `${network} - zkVoiceDetector`,
                nativeCurrency: {
                  name: "tETH",
                  symbol: "tETH",
                  decimals: 18,
                },
                rpcUrls: [deployment.url],
                // blockExplorerUrls: [],
              },
            ],
          });
        } catch (addErr) {
          console.log(addErr);
        }
      }
      console.log(switchErr);
    }

    const accounts: string[] = await newProvider.send("eth_requestAccounts", []);

    const signer = await newProvider.getSigner(accounts[0]);
    console.log("signer", signer.address);

    if ((await signer.provider.getBalance(signer.address)) === 0n) {
      alert("Account has no balance. Please fund your account before connect wallet");
      return;
    }

    setSelectedNetwork(network);

    const verifierAddress = PROD ? deployment.contracts.Verifier : deployment.contracts.MockVerifier;
    console.log("Verifier: %s", verifierAddress);

    setMetamaskState({
      network,
      account: await signer.getAddress(),
      signer,
      deployment,
      contracts: {
        Verifier: Verifier__factory.connect(verifierAddress).connect(signer),
      },
    });

    // const accounts = await newProvider.send("eth_requestAccounts", []);
    // console.log("accounts", accounts);
  };

  const selectNetwork = async (network: string) => {
    // skip if already connected to same network
    if (metamaskState && metamaskState.network === selectedNetwork) return;
    await connectMetamask(network);
  };

  // pagination
  const [pageName, setPageName] = useState<
    | "RegisterVoice1"
    | "RegisterVoice2"
    | "RegisterVoice3"
    | "TestVoice1"
    | "TestVoice2"
    | "TestVoice3"
    | "TestVoice4_1"
    | "TestVoice4_2"
  >("RegisterVoice1");

  const RegisterVoice1 = {
    Box: BoxRegister1,
    Button: IconRegister1,
    buttonStyle: defaultButtonStyle,
    onButtonClick: async () => {
      if (!metamaskState) {
        await connectMetamask(selectedNetwork);
      }
      setRecordHandler(await RecordHandler.start());
      setPageName("RegisterVoice2");
    },
  };

  const RegisterVoice2 = {
    Box: BoxRegister2,
    Button: IconRegister2,
    buttonStyle: {
      position: "absolute" as "absolute",
      width: "5.4531vw",
      height: "8.651vh",
      left: "26.3vw",
      top: "62.1vh",
      cursor: "pointer",
    },
    onButtonClick: async () => {
      invariant(recordHandler, "recordHandler should not be null");
      const mp3Blob = await convertWebmToWav(await recordHandler.stop());
      console.log("hacker's mp3blob loaded: %s", mp3Blob.size);

      setRecordHandler(null);
      setHackerBlob(mp3Blob);
      setPageName("RegisterVoice3");
    },
  };

  const RegisterVoice3 = {
    Box: BoxRegister3,
    Button: IconRegister3,
    buttonStyle: {
      position: "absolute" as "absolute",
      width: "2.7344vw",
      height: "4.2067vh",
      left: "27.5781vw",
      top: "49.5vh",
      cursor: "pointer",
    },
    onButtonClick: async () => {
      setPageName("TestVoice1");
    },
  };

  const TestVoice1 = {
    Box: BoxTest1,
    Button: IconTest1,
    buttonStyle: defaultButtonStyle,
    onButtonClick: async () => {
      setRecordHandler(await RecordHandler.start());
      setPageName("TestVoice2");
    },
  };

  const TestVoice2 = {
    Box: BoxTest2,
    Button: IconTest2,
    buttonStyle: {
      position: "absolute" as "absolute",
      width: "5.4531vw",
      height: "8.651vh",
      left: "26.3vw",
      top: "61.1vh",
      cursor: "pointer",
    },
    onButtonClick: async () => {
      invariant(recordHandler, "recordHandler should not be null");
      const userBlob = await convertWebmToWav(await recordHandler.stop());
      console.log("user's mp3blob loaded: %s", userBlob.size);

      setRecordHandler(null);
      setUserBlob(userBlob);

      (async () => {
        // use api to get match result
        const timestamp = Math.floor(Date.now() / 1000);
        const userFileName = `user_${timestamp}.wav`;
        const hackerFileName = `hacker_${timestamp}.wav`;

        invariant(userBlob, "userBlob should not be null");
        invariant(hackerBlob, "hackerBlob should not be null");
        const formData = new FormData();

        // use real server
        formData.append("file", userBlob, userFileName);
        console.log("Uploading audio file: %s", userFileName);

        const res:
          | undefined
          | {
              match: boolean;
              pubInputs: number[];
              proof: string;
            } = await fetch(API_PATH, {
          method: "POST",
          body: formData,
        })
          .then((res) => res.json())
          .catch(async (err) => {
            console.log("Failed to upload file");
            if ("json" in err) {
              console.error(await err.json());
            } else {
              console.error(err);
            }
          });

        if (!res) {
          setPageName("TestVoice4_2");
          return;
        }

        const { match, pubInputs, proof } = res;

        console.log("/auth api response: ", res);

        invariant(metamaskState, "metamaskState should not be null");

        // verify on-chain
        const matchOnChain = await metamaskState.contracts.Verifier.verify.staticCall(pubInputs, proof).catch((err) => {
          console.error(err);
          return false;
        });

        invariant(matchOnChain === match, "matchOnChain should be equal to match");

        // send transaction...
        const tx = await metamaskState.contracts.Verifier.verify.send(pubInputs, proof);
        console.log("tx: %s", tx.hash);

        if (matchOnChain) {
          setPageName("TestVoice4_2");
        } else {
          setPageName("TestVoice4_1");
        }
      })();
      setPageName("TestVoice3");
    },
  };

  const TestVoice3 = {
    Box: BoxTest3,
    Button: null,
    buttonStyle: null,
    onButtonClick: null,
  };

  const TestVoice4_1 = {
    Box: BoxTestNoProblem,
    Button: null,
    buttonStyle: null,
    onButtonClick: null,
  };
  const TestVoice4_2 = {
    Box: BoxTestHacker,
    Button: null,
    buttonStyle: null,
    onButtonClick: null,
  };

  const goToRegisterVoice1 = () => {
    setHackerBlob(null);
    setUserBlob(null);
    setRecordHandler(null);
    setPageName("RegisterVoice1");
  };
  const goToTestVoice1 = () => {
    if (!hackerBlob) {
      alert("Please register hakcer's voice first");
      goToRegisterVoice1();
      return;
    }
    setPageName("TestVoice1");
  };

  const page =
    pageName === "RegisterVoice1"
      ? RegisterVoice1
      : pageName === "RegisterVoice2"
      ? RegisterVoice2
      : pageName === "RegisterVoice3"
      ? RegisterVoice3
      : pageName === "TestVoice1"
      ? TestVoice1
      : pageName === "TestVoice2"
      ? TestVoice2
      : pageName === "TestVoice3"
      ? TestVoice3
      : pageName === "TestVoice4_1"
      ? TestVoice4_1
      : TestVoice4_2;

  return (
    <div style={containerStyle}>
      <img src={BG} style={backgroundStyle} alt="" />

      <div>
        <div
          style={{
            position: "absolute",
            width: "15.4688vw",
            height: "3.4856vh",
            fontFamily: "Noto Sans KR",
            fontStyle: "normal",
            fontWeight: "700",
            fontSize: "20px",
            lineHeight: "29px",
            color: "#d4d0ff",

            left: "30vw",
            top: "5vh",
          }}
        >
          <a href="#" onClick={goToRegisterVoice1}>
            피싱 목소리 등록하기
          </a>
        </div>
        <div
          style={{
            position: "absolute",
            width: "13.6719vw",
            height: "3.4856vh",
            fontFamily: "Noto Sans KR",
            fontStyle: "normal",
            fontWeight: "700",
            fontSize: "20px",
            lineHeight: "29px",
            color: "#c2fffe",

            left: "60vw",
            top: "5vh",
          }}
        >
          <a href="#" onClick={goToTestVoice1}>
            피싱 목소리 테스트 하기
          </a>
        </div>
      </div>

      {/* nav */}
      <nav className="flex justify-end fixed top-0 right-0 mr-2 mt-2">
        <Menu as="div" className="relative flex text-left">
          {/* "Connect Wallet" button or connected account address */}
          <div className="block mx-1">
            <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              {metamaskState
                ? metamaskState.account.slice(0, 6) + "..." + metamaskState.account.slice(-4)
                : "Connect Wallet"}
            </Menu.Button>
          </div>

          {/* network select dropdown button */}
          <div className="block mx-1">
            <Menu.Button className="inline-flex w-full gap-x-1.5 rounded-md bg-white px-5 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              {selectedNetwork ?? "Select Network"}
              <ChevronDownIcon className="-mr-1 h-5 w-full text-gray-400 end-1" aria-hidden="true" />
            </Menu.Button>
          </div>

          {/* network select dropdown options */}
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute z-10 mt-10 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {Object.entries(Deployment).map(([networkName, deployment]) => (
                  <Menu.Item key={networkName}>
                    {({ active }) => (
                      <a
                        href="#"
                        className={classNames(
                          active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                          "block px-4 py-2 text-sm"
                        )}
                        onClick={() => selectNetwork(networkName)}
                      >
                        {networkName}
                      </a>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </nav>

      {/* main page */}
      <img src={page.Box} style={boxStyle} alt="" />
      {page.Button && (
        <img src={page.Button} onClick={page.onButtonClick ?? (() => {})} style={page.buttonStyle} alt="" />
      )}
      {pageName === "RegisterVoice1" && (
        <div
          style={{
            position: "absolute" as "absolute",
            width: "30.2344vw",
            height: "3.4856vh",
            left: "13.8281vw",
            top: "79.9279vh",

            fontFamily: "Noto Sans KR",
            fontStyle: "normal",
            fontWeight: 700,
            fontSize: "20px",
            lineHeight: "29px",
            textAlign: "center",

            color: "#ffffff",
          }}
        >
          실제 서비스에서는 기학습된 모델을 활용합니다
        </div>
      )}
    </div>
  );
}

export default App;

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
