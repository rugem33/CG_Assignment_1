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

    var rectangleVertices = [ 
        -0.5,  0.0, -0.5,  1.0, 0.0, 0.0, 1.0,
         0.5,  0.0, -0.5,  0.0, 1.0, 0.0, 1.0,
         0.5,  0.0,  0.5,  0.0, 0.0, 1.0, 1.0,
        -0.5,  0.0,  0.5,  1.0, 1.0, 0.0, 1.0,
         0.0,  0.75, 0.0,  0.0, 1.0, 1.0, 1.0 
    ];

     var rectangleIndices = [
        0, 1, 2,
        2, 3, 0,
        0, 1, 4,
        1, 2, 4,
        2, 3, 4,
        3, 0, 4,
    ];

    let objVA1 = new VertexArray(gl); 
    let objVB1 = new VertexBuffer(gl,rectangleVertices);
    objVA1.AddBuffer(objVB1, [3, 4], [false, false]); 
    let objIB1 = new IndexBuffer(gl, rectangleIndices, rectangleIndices.length);

    let shader = new Shader(gl,basicVertex,basicFragment);
        
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
    let camera = new OrbitCamera(at, yaw, pitch, distance, 0.01);

    let projectionMatrix = mat4.create();
    let fovy = 60.0 * Math.PI / 180.0;
    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight; 
    let near = 0.1;
    let far = 100.0;
    mat4.perspective(projectionMatrix, fovy, aspect, near, far);

    gl.enable(gl.DEPTH_TEST);

    const objTransCoord = [
        [-1.5, -1.0, 0.0],
        [ 1.5, -1.0, 0.0],
        [-1.5, -0.5, 0.0],
        [ 1.5, -0.5, 0.0],
    ];

    requestAnimationFrame(drawScene);

    function drawScene() {
        
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        renderer.Clear();
        {
            for (let i = 0; i < objTransCoord.length; i++) {
                let modelMatrix = mat4.create();
                mat4.fromYRotation(modelMatrix, worldRotation);
                if (i >= 2) mat4.rotateX(modelMatrix, modelMatrix, Math.PI);
                mat4.translate(modelMatrix, modelMatrix, objTransCoord[i]);
                mat4.rotateY(modelMatrix, modelMatrix, objectRotation);
                shader.Bind();
                shader.SetUniformMatrix4f("u_model", modelMatrix);
                shader.SetUniformMatrix4f("u_view", camera.GetViewMatrix());
                shader.SetUniformMatrix4f("u_projection", projectionMatrix);

                renderer.Draw(objVA1, objIB1, shader);
            }
        }        
        requestAnimationFrame(drawScene);
    }

    drawScene();
}

main();