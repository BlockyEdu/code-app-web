import { BeaconScene } from "./BeaconScene";
import { IrrigationScene } from "./IrrigationScene";
import type { StageModel } from "./map-scene";
import { PondScene } from "./PondScene";
import { RoomNodeScene } from "./RoomNodeScene";
import { RoverScene } from "./RoverScene";
import { SmarthomeScene } from "./SmarthomeScene";
import { SmartWindowScene } from "./SmartWindowScene";
import { ToyScene } from "./ToyScene";

const TITLES: Record<StageModel["sceneId"], string> = {
  "smart-window": "stage.sceneTitle.window",
  "agri-irrigation": "stage.sceneTitle.irrigation",
  "agri-pond": "stage.sceneTitle.pond",
  "air-beacon": "stage.sceneTitle.beacon",
  "desk-rover": "stage.sceneTitle.rover",
  "room-node": "stage.sceneTitle.room",
  smarthome: "stage.sceneTitle.home",
  toy: "stage.sceneTitle.toy",
};

export function sceneTitleKey(sceneId: StageModel["sceneId"]): string {
  return TITLES[sceneId];
}

export function SceneView({ model, label }: { model: StageModel; label: string }) {
  switch (model.sceneId) {
    case "smart-window":
      return (
        <SmartWindowScene
          label={label}
          openPct={model.window.openPct}
          raining={model.window.raining}
        />
      );
    case "agri-irrigation":
      return (
        <IrrigationScene
          label={label}
          soil={model.irrigation.soil}
          pumpOn={model.irrigation.pumpOn}
          flowing={model.irrigation.flowing}
          raining={model.irrigation.raining}
        />
      );
    case "agri-pond":
      return (
        <PondScene
          label={label}
          levelPct={model.pond.levelPct}
          aeratorOn={model.pond.aeratorOn}
          sprayOn={model.pond.sprayOn}
        />
      );
    case "desk-rover":
      return <RoverScene label={label} speed={model.rover.speed} ledOn={model.rover.ledOn} />;
    case "room-node":
      return (
        <RoomNodeScene
          label={label}
          temperature={model.room.temperature}
          humidity={model.room.humidity}
          relayOn={model.room.relayOn}
        />
      );
    case "smarthome":
      return (
        <SmarthomeScene
          label={label}
          lights={model.home.lights}
          fan={model.home.fan}
          curtain={model.home.curtain}
          ac={model.home.ac}
        />
      );
    case "toy":
      return (
        <ToyScene
          label={label}
          expression={model.toy.expression}
          led={model.toy.led}
          speech={model.toy.speech}
          speed={model.toy.speed}
          nudgeX={model.toy.nudgeX}
        />
      );
    default:
      return (
        <BeaconScene
          label={label}
          temperature={model.beacon.temperature}
          humidity={model.beacon.humidity}
          live={model.beacon.live}
        />
      );
  }
}
