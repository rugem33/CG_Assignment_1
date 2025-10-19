"use strict";

import { VertexBuffer } from "./rendering/core/VertexBuffer.js";
import { IndexBuffer } from "./rendering/core/IndexBuffer.js";
import { VertexArray } from "./rendering/core/VertexArray.js";
import { Shader } from "./rendering/core/Shader.js";
import { Renderer } from "./rendering/core/Renderer.js";
import { OrbitCamera } from "./rendering/core/OrbitCamera.js";

import basicVertex from "./resources/shaders/assignmentVertex.js";
import basicFragment from "./resources/shaders/assignmentFragment.js";

const { mat4, vec4 } = glMatrix;

function main() {
    // main() 함수 내 필요한 모든 내용을 작성 하십시오.

    // 올바른 결과를 보기 위해서는 깊이 테스트가 활성화되어 있어야 합니다.
    // Draw Call을 호출하기 전에 아래 함수를 호출하십시오.
    
    var canvas = document.querySelector("#c");
    var gl = canvas.getContext("webgl2");
    if (!gl) {
        return;
    }

    let program = new Shader(gl, basicVertex, basicFragment);

    let renderer = new Renderer(gl);

    const pitchslider = document.getElementById("pitchslider");
    pitchslider.addEventListener('input', ()=>{
        camera.pitch = pitchslider.value;
        camera.Update();
    });

    const yawslider = document.getElementById("yawslider");
    yawslider.addEventListener('input', ()=>{
        camera.yaw = yawslider.value;
        camera.Update();
    });

    const distanceslider = document.getElementById("distanceslider");
    distanceslider.addEventListener('input', ()=>{
        camera.distance = distanceslider.value;
        camera.Update();
    });

    let at = [0,0,0];
    let yaw = yawslider.value;
    let pitch = pitchslider.value;
    let distance = distanceslider.value;
    // OrbitCamera 객체 생성
    // at: 카메라가 바라보는 지점, yaw: y축 기준 회전각, pitch: x축 기준 회전각, distance: at 지점으로부터 카메라까지의 거리, turnspeed: 마우스 드래그 시 회전 속도
    let camera = new OrbitCamera(at, yaw, pitch, distance, 0.01);

    let projectionMatrix = mat4.create();
    let fovy = 60.0 * Math.PI / 180.0; // 라디안 단위
    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight; 
    let near = 0.1;
    let far = 100.0;
    mat4.perspective(projectionMatrix, fovy, aspect, near, far);

    gl.enable(gl.DEPTH_TEST);

    
}

main();