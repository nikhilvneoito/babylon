import Head from 'next/head'
import { Inter } from '@next/font/google'
import * as BABYLON from '@babylonjs/core';
import { useEffect } from 'react';
import '@babylonjs/loaders';

interface ICameraInput<TCamera extends BABYLON.Camera> {
  // the input manager will fill the parent camera
  camera: TCamera;

  //this function must return the class name of the camera, it could be used for serializing your scene
  getClassName(): string;

  //this function must return the simple name that will be injected in the input manager as short hand
  //for example "mouse" will turn into camera.inputs.attached.mouse
  getSimpleName(): string;

  //this function must activate your input, event if your input does not need a DOM element
  attachControl: (element: HTMLElement, noPreventDefault?: boolean) => void;

  //detach control must deactivate your input and release all pointers, closures or event listeners
  detachControl: (element: HTMLElement) => void;

  //this optional function will get called for each rendered frame, if you want to synchronize your input to rendering,
  //no need to use requestAnimationFrame. It's a good place for applying calculations if you have to
  checkInputs?: () => void;
}

class FreeCameraKeyboardRotateInput implements BABYLON.ICameraInput<BABYLON.ArcRotateCamera> {
  camera: BABYLON.ArcRotateCamera | any;
  _keys: any = []
  keysUp: any = [38];
  keysDown: any = [40];
  keysLeft: any = [37];
  keysRight: any = [39];
  keyW: any = [87];
  keyS: any = [83];
  keyA: any = [65];
  keyD: any = [68];
  sensibility: any = 0.00001;
  _onKeyDown: any;
  _onKeyUp: any;
  _onLostFocus() { this._keys = []; }
  getClassName() { return "FreeCameraKeyboardRotateInput"; }
  getSimpleName() { return "keyboardRotate"; }
  attachControl(noPreventDefault?: boolean | undefined): void {
    const _this = this;
    const engine = this.camera.getEngine();
    const element = engine.getInputElement();
    if (!this._onKeyDown) {
      element.tabIndex = 1;
      this._onKeyDown = function (evt: any) {
        if (_this.keysUp.indexOf(evt.keyCode) !== -1 ||
          _this.keysDown.indexOf(evt.keyCode) !== -1 ||
          _this.keysLeft.indexOf(evt.keyCode) !== -1 ||
          _this.keysRight.indexOf(evt.keyCode) !== -1 ||
          _this.keyW.indexOf(evt.keyCode) !== -1 ||
          _this.keyS.indexOf(evt.keyCode) !== -1 ||
          _this.keyA.indexOf(evt.keyCode) !== -1 ||
          _this.keyD.indexOf(evt.keyCode) !== -1) {
          var index = _this._keys.indexOf(evt.keyCode);
          if (index === -1) {
            _this._keys.push(evt.keyCode);
          }
          if (!noPreventDefault) {
            evt.preventDefault();
          }
        }
      };
      this._onKeyUp = function (evt: any) {
        if (_this.keysUp.indexOf(evt.keyCode) !== -1 ||
          _this.keysDown.indexOf(evt.keyCode) !== -1 ||
          _this.keysLeft.indexOf(evt.keyCode) !== -1 ||
          _this.keysRight.indexOf(evt.keyCode) !== -1 ||
          _this.keyW.indexOf(evt.keyCode) !== -1 ||
          _this.keyS.indexOf(evt.keyCode) !== -1 ||
          _this.keyA.indexOf(evt.keyCode) !== -1 ||
          _this.keyD.indexOf(evt.keyCode) !== -1) {
          var index = _this._keys.indexOf(evt.keyCode);
          if (index >= 0) {
            _this._keys.splice(index, 1);
          }
          if (!noPreventDefault) {
            evt.preventDefault();
          }
        }
      };
      element.addEventListener("keydown", this._onKeyDown, false);
      element.addEventListener("keyup", this._onKeyUp, false);
    }
  }
  detachControl(): void {
    const engine = this.camera.getEngine();
    const element = engine.getInputElement();
    if (this._onKeyDown) {
      element.removeEventListener("keydown", this._onKeyDown);
      element.removeEventListener("keyup", this._onKeyUp);
      this._keys = [];
      this._onKeyDown = null;
      this._onKeyUp = null;
    }
  }
  checkInputs(): void {
    if (this._onKeyDown) {
      var camera = this.camera;
      var angularSpeed = 0.01;
      for (var index = 0; index < this._keys.length; index++) {
        var keyCode = this._keys[index];
        var speed = camera.speed;
        if (this.keysLeft.indexOf(keyCode) !== -1 || this.keyA.indexOf(keyCode) !== -1) {
          camera.rotation.y -= angularSpeed;
          camera._localDirection.copyFromFloats(0, 0, 0);
        }
        else if (this.keysRight.indexOf(keyCode) !== -1 || this.keyD.indexOf(keyCode) !== -1) {
          camera.rotation.y += angularSpeed;
          camera._localDirection.copyFromFloats(0, 0, 0);
        }
        else if (this.keysUp.indexOf(keyCode) !== -1 || this.keyW.indexOf(keyCode) !== -1) {
          camera._localDirection.copyFromFloats(0, 0, speed / 4);
        }
        else if (this.keysDown.indexOf(keyCode) !== -1 || this.keyS.indexOf(keyCode) !== -1) {
          camera._localDirection.copyFromFloats(0, 0, -speed / 4);
        }
        if (camera.getScene().useRightHandedSystem) {
          camera._localDirection.z *= -1;
        }
        camera.getViewMatrix().invertToRef(camera._cameraTransformMatrix);
        BABYLON.Vector3.TransformNormalToRef(camera._localDirection, camera._cameraTransformMatrix, camera._transformedDirection);
        camera.cameraDirection.addInPlace(camera._transformedDirection);
      }
    }
  }
}


export default function Home() {

  var engine: BABYLON.Engine;
  var scene: BABYLON.Scene;
  var canvas: HTMLCanvasElement;

  const importHouseModel = async (scene: BABYLON.Scene, pos_x: number, pos_z: number, rot: number) => {
    const house = await BABYLON.SceneLoader.ImportMesh('', '/Cottage_FREE.obj', '', scene,
      (mesh: BABYLON.AbstractMesh[]) => {
        mesh[0].position = new BABYLON.Vector3(pos_x, 0, pos_z);
        mesh[0].rotation = new BABYLON.Vector3(0, rot, 0);
        const material = new BABYLON.StandardMaterial('wood', scene);
        material.ambientTexture = new BABYLON.Texture('/wood.jpg', scene);
        mesh[0].material = material;
        mesh[0].checkCollisions = true;
      },
    )
  }

  const importSecondHouseModel = async (scene: BABYLON.Scene) => {
    const house = await BABYLON.SceneLoader.ImportMesh('', '/Bambo_House.obj', '', scene,
      (mesh: BABYLON.AbstractMesh[]) => {
        console.log(mesh)
        mesh.forEach((subMesh: BABYLON.AbstractMesh) => {
          subMesh.position = new BABYLON.Vector3(20, 0, 26);
          subMesh.rotation = new BABYLON.Vector3(0, 0, 0);
          subMesh.checkCollisions = true;
        })
      },
    )
  }

  const importThirdHouseModel = async (scene: BABYLON.Scene) => {
    const house = await BABYLON.SceneLoader.ImportMesh('', '/building_04.obj', '', scene,
      (mesh: BABYLON.AbstractMesh[]) => {
        console.log(mesh)
        mesh.forEach((subMesh: BABYLON.AbstractMesh) => {
          subMesh.position = new BABYLON.Vector3(-20, 3, 23);
          subMesh.rotation = new BABYLON.Vector3(0, 0, 0);
          subMesh.scaling = new BABYLON.Vector3(3, 5, 3);
          subMesh.checkCollisions = true;
        })
      },
    )
  }

  const importRoad = async () => {
    const road = await BABYLON.SceneLoader.ImportMesh('', '/road.obj', '', scene,
      (mesh: BABYLON.AbstractMesh[]) => {
        mesh[0].position = new BABYLON.Vector3(0, 0.1, 0);
        mesh[0].rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
        mesh[0].scaling = new BABYLON.Vector3(6, 0.5, 12);
        mesh[0].checkCollisions = true;
      },
    )
  }

  const importNeoModel = async (scene: BABYLON.Scene) => {
    const neo = await BABYLON.SceneLoader.ImportMesh('', '/neo/18b403df-fef2-4b6f-96bc-ffb440bb0b70.obj', '', scene,
      (mesh: BABYLON.AbstractMesh[]) => {
        // console.log(mesh)
        mesh.forEach((subMesh: BABYLON.AbstractMesh) => {
          subMesh.scaling = new BABYLON.Vector3(0.005, 0.005, 0.005);
          subMesh.position = new BABYLON.Vector3(0, 0, 0);
          subMesh.checkCollisions = true;
        })
      },
    )
  }

  const createScene = (scene: BABYLON.Scene) => {
    const camera = new BABYLON.UniversalCamera("MyCamera", new BABYLON.Vector3(100, 70, 50), scene);
    camera.minZ = 0.1;
    camera.attachControl(canvas, true);
    camera.speed = 0.1;
    camera.rotation = new BABYLON.Vector3(Math.PI / 20, -Math.PI / 2, 0);
    camera.checkCollisions = true;
    camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
    camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput");
    camera.inputs.add(new FreeCameraKeyboardRotateInput());
    const light = new BABYLON.HemisphericLight('light',
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    light.intensity = 0.7;
    const ground = BABYLON.MeshBuilder.CreateGround('ground',
      { width: 100, height: 100 },
      scene
    );
    ground.checkCollisions = true;
    // importHouseModel(scene, 0, 20, 0);
    // importSecondHouseModel(scene);
    // importThirdHouseModel(scene);
    // importHouseModel(scene, 0, -20, Math.PI);
    // importHouseModel(scene, 20, -20, Math.PI);
    // importHouseModel(scene, -20, -20, Math.PI);
    // importRoad();
    importNeoModel(scene);
    return scene
  }

  useEffect(() => {
    canvas = document.getElementById('babylonCanvas') as HTMLCanvasElement;
    engine = new BABYLON.Engine(canvas);
    scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;
    engine.runRenderLoop(() => {
      scene.render();
    })
    createScene(scene);
  }, [])

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <script src="https://cdn.babylonjs.com/babylon.js"></script>
        <script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
        <script src="babylon.glTFFileLoader.js"></script>
      </Head>
      <div style={{ width: '100vw', height: '96vh', overflow: 'hidden' }}>
        <canvas id='babylonCanvas' style={{ width: '100%', height: '100%', overflow: 'hidden' }}></canvas>
      </div>
    </>
  )
}
