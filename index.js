"use strict";

import { VertexBuffer } from "./rendering/core/VertexBuffer.js";
import { IndexBuffer } from "./rendering/core/IndexBuffer.js";
import { VertexArray } from "./rendering/core/VertexArray.js";
import { Shader } from "./rendering/core/Shader.js";
import { Renderer } from "./rendering/core/Renderer.js";
import { OrbitCamera } from "./rendering/core/OrbitCamera.js";

import basicVertex from "./resources/shaders/assignmentVertex.js";
import basicFragment from "./resources/shaders/assignmentFragment.js";
import assignmentVertex from "./resources/shaders/assignmentVertex.js";
import assignmentFragment from "./resources/shaders/assignmentFragment.js";

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

    // 사각뿔(피라미드) 정점 데이터: [x, y, z, r, g, b, a]
    // 바닥 정점 4개 + 꼭짓점 1개
    var rectangleVertices = [ 
    //    x     y     z     r    g    b    a
        -0.5,  0.0, -0.5,  1.0, 0.0, 0.0, 1.0, // v0
         0.5,  0.0, -0.5,  0.0, 1.0, 0.0, 1.0, // v1
         0.5,  0.0,  0.5,  0.0, 0.0, 1.0, 1.0, // v2
        -0.5,  0.0,  0.5,  0.8, 0.2, 0.3, 1.0, // v3
         0.0,  0.75, 0.0,  1.0, 1.0, 0.0, 1.0  // v4 (apex)
    ];

     // 인덱스: 바닥(두 삼각형) + 옆면(네 삼각형)
     var rectangleIndices = [
        // base
        0, 1, 2,
        2, 3, 0,
        // sides
        0, 1, 4,
        1, 2, 4,
        2, 3, 4,
        3, 0, 4,
    ];

    let objVA1 = new VertexArray(gl); 
    let objVB1 = new VertexBuffer(gl,rectangleVertices);
    // 위치를 vec3로, 색상을 vec4로 전달
    objVA1.AddBuffer(objVB1, [3, 4], [false, false]); 
    let objIB1 = new IndexBuffer(gl, rectangleIndices, rectangleIndices.length);

    //glMatrix의 함수를 사용해 orthographic projection matrix를 생성합니다.
    let proj = mat4.create();
    mat4.ortho(proj,-2.0, 2.0, -1.5, 1.5, -1.0, 1.0);

    let shader = new Shader(gl,assignmentVertex,assignmentFragment);
        
    objVA1.Unbind(gl); 
    objVB1.Unbind(gl);
    objIB1.Unbind(gl);

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

    const worldlocalslider = document.getElementById("worldlocalslider");
    worldlocalslider.addEventListener('input', ()=>{
        camera.isWorld = worldlocalslider.value;
    });

    let worldRotation = 0.0;
    let objectRotation = 0.0;

    const angleslider = document.getElementById("angleslider");
    angleslider.addEventListener('input', ()=>{
        if (camera.isWorld < 0.5 || camera.isWorld == null ) {
            worldRotation = angleslider.value / 180.0 * Math.PI;
            camera.Update();
        }else{
            objectRotation = angleslider.value / 180.0 * Math.PI;
            camera.Update();
        }
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

    // v4(꼭짓점) 기준 점대칭 변환: T(v4) * S(-1,-1,-1) * T(-v4)
    const apex = [0.0, 0.75, 0.0];
    const mirrorAroundApex = mat4.create();
    mat4.translate(mirrorAroundApex, mirrorAroundApex, apex);
    mat4.scale(mirrorAroundApex, mirrorAroundApex, [-1.0, -1.0, -1.0]);
    mat4.translate(mirrorAroundApex, mirrorAroundApex, [-apex[0], -apex[1], -apex[2]]);

    // 4개의 사각뿔 배치: 각 쌍을 겹치게 배치하고, 두 번째(1,3)만 점대칭 적용
    const perObjectTranslations = [
        [-1.0, -1.0, -2.0], // 0번
        [-1.0, -1.0, -2.0], // 1번 (0과 겹침, 점대칭 대상)
        [ 1.0, -1.0, -2.0], // 2번
        [ 1.0, -1.0, -2.0], // 3번 (2와 겹침, 점대칭 대상)
    ];
    const mirroredInstanceIds = new Set([1, 3]);

    requestAnimationFrame(drawScene);

    function drawScene() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        renderer.Clear();

        for (let i = 0; i < perObjectTranslations.length; i++) {
            let modelMatrix = mat4.create();
            mat4.fromYRotation(modelMatrix, worldRotation); // 월드 회전
            mat4.translate(modelMatrix, modelMatrix, perObjectTranslations[i]); // 위치 이동
            if (mirroredInstanceIds.has(i)) {
                mat4.multiply(modelMatrix, modelMatrix, mirrorAroundApex); // 로컬 축 점대칭
            }
            if (camera.isWorld >= 0.5) {
                mat4.rotateY(modelMatrix, modelMatrix, objectRotation); // 로컬 회전
            }

            shader.Bind();
            shader.SetUniformMatrix4f("u_model", modelMatrix);
            shader.SetUniformMatrix4f("u_view", camera.GetViewMatrix());
            shader.SetUniformMatrix4f("u_projection", projectionMatrix);

            renderer.Draw(objVA1, objIB1, shader);
        }

        requestAnimationFrame(drawScene);
    }
}

main();