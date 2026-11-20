import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { disposeOwnedResources } from "./tank3d";

describe("Winter Front 3D renderer resource lifecycle",()=>{
  it("releases shared-in-session mesh resources exactly once",()=>{
    const root=new THREE.Group();
    const geometry=new THREE.BoxGeometry(1,1,1);
    const material=new THREE.MeshLambertMaterial({color:0xaabbcc});
    const geometryDispose=vi.spyOn(geometry,"dispose");
    const materialDispose=vi.spyOn(material,"dispose");
    root.add(new THREE.Mesh(geometry,material));
    const child=new THREE.Group();
    child.add(new THREE.Mesh(geometry,material));
    root.add(child);
    disposeOwnedResources(root);
    expect(geometryDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
  });
  it("disposes removed units explicitly and the remaining scene independently",()=>{
    const scene=new THREE.Scene();
    const removed=new THREE.Group();
    const goneGeometry=new THREE.SphereGeometry(.5,8,6);
    const goneMaterial=new THREE.MeshBasicMaterial({color:0xffaa00});
    const gone=vi.spyOn(goneGeometry,"dispose");
    const goneMat=vi.spyOn(goneMaterial,"dispose");
    removed.add(new THREE.Mesh(goneGeometry,goneMaterial));
    scene.add(removed);
    scene.remove(removed);
    disposeOwnedResources(removed);
    const liveGeometry=new THREE.PlaneGeometry(2,2);
    const liveMaterial=new THREE.MeshLambertMaterial({color:0x777777});
    const live=vi.spyOn(liveGeometry,"dispose");
    const liveMat=vi.spyOn(liveMaterial,"dispose");
    scene.add(new THREE.Mesh(liveGeometry,liveMaterial));
    disposeOwnedResources(scene);
    expect(gone).toHaveBeenCalledTimes(1);
    expect(goneMat).toHaveBeenCalledTimes(1);
    expect(live).toHaveBeenCalledTimes(1);
    expect(liveMat).toHaveBeenCalledTimes(1);
  });
  it("does not reuse disposable objects across independent scene sessions",()=>{
    const session=(color:number)=>{
      const scene=new THREE.Scene();
      const material=new THREE.MeshBasicMaterial({color});
      const geometry=new THREE.TorusGeometry(1,.1,4,8);
      scene.add(new THREE.Mesh(geometry,material));
      const materialSpy=vi.spyOn(material,"dispose");
      const geometrySpy=vi.spyOn(geometry,"dispose");
      disposeOwnedResources(scene);
      return {material,geometry,materialSpy,geometrySpy};
    };
    const first=session(0x222222),second=session(0xeeeeee);
    expect(first.geometry).not.toBe(second.geometry);
    expect(first.material).not.toBe(second.material);
    expect(first.materialSpy).toHaveBeenCalledTimes(1);
    expect(second.materialSpy).toHaveBeenCalledTimes(1);
    expect(first.geometrySpy).toHaveBeenCalledTimes(1);
    expect(second.geometrySpy).toHaveBeenCalledTimes(1);
  });
});
