'use strict';

import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';

import {
  OrbitControls
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js';

/**
 * 일반적으로 애니메이션을 렌더하는 텍스처를 사용할때는 캔버스 텍스처보다는 RenderTarget을 사용하는 게 좋음.
 * 
 * 그럼 캔버스 텍스처는 주로 어디에 쓸까?
 * 주로 '텍스트'를 삽입해야 하는 텍스처가 필요할 때 주로 사용함.
 * 예를 들어, 캐릭터의 명찰에 이름을 표기할 때, 명찰의 텍스처를 캔버스 텍스처로 지정하는 게 나음.
 * 
 * 2번 예제에서는 간단한 캐릭터들을 만들고, 각 캐릭터들의 이름이 표기된 명찰을 캔버스 텍스처를 이용해서 렌더해볼것임.
 */

function main() {
  // create WebGLRenderer
  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas
  });

  // create camera
  const fov = 75;
  const aspect = 2;
  const near = 0.1;
  const far = 50;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 2, 5);

  // create OrbitControls
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 2, 0); // OrbitControls가 카메라를 움직일 때마다 카메라의 시선을 해당 좌표값으로 고정시킴
  controls.update(); // OrbitControls의 속성값을 바꿔줬으면 업데이트를 호출해줘야 함.

  // create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('white'); // 배경은 흰색으로 바꿔줌.

  // DirectionalLight(직사광)을 생성하여 씬에 추가하는 함수
  function addLight(position) {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(...position); // 전달받은 x, y, z 좌표값이 담긴 배열의 요소들을 하나하나 낱개로 복사하여 position이라는 Vector3의 x, y, z에 각각 넣어줘서 조명의 위치를 설정해 줌.
    scene.add(light);
    scene.add(light.target); // 조명의 타겟도 씬에 추가함. 타겟의 좌표값을 별도 지정하지 않으면 (0, 0, 0) 지점을 향해 빛을 쏴주도록 되어있음.
  }
  addLight([-3, 1, 1]);
  addLight([2, 1, 0.5]); // 각각 다른 방향에서 오는 직사광을 두 개 만들어 줌.

  // 원통이 몸, 구체가 머리, 평면이 명찰인 캐릭터를 만들 때 사용할 공통 geometry들을 만들어 줌
  const bodyRadiusTop = 0.4;
  const bodyRadiusBottom = 0.2;
  const bodyHeight = 2;
  const bodyRadialSegments = 6;
  const bodyGeometry = new THREE.CylinderGeometry(
    bodyRadiusTop, bodyRadiusBottom, bodyHeight, bodyRadialSegments
  ); // 원통 지오메트리를 만듦.

  const headRadius = bodyRadiusTop * 0.8;
  const headLonSegments = 12;
  const headLatSegments = 5;
  const headGeometry = new THREE.SphereGeometry(
    headRadius, headLonSegments, headLatSegments
  ); // 구체 지오메트리를 만듦.

  const labelGeometry = new THREE.PlaneGeometry(1, 1); // 1*1 사이즈의 평면 지오메트리도 만듦.

  // 2D 캔버스를 생성하되, 2번 예제에서는 캔버스마다 애니메이션이나 자주 업데이트를 하는 게 아니기 때문에 캔버스를 따로 쓸 필요가 없음.
  // 그래서 하나의 캔버스만 생성해서 여러 캔버스 텍스처에 돌려쓰는 방식이 더 낫기 때문에 makeLabelCanvas 함수 밖에서 생성해놓은 것.
  const ctx = document.createElement('canvas').getContext('2d');

  // 2D 캔버스를 생성한 뒤, 명찰에 들어갈 이름 텍스트를 캔버스에 렌더해줘서 리턴해주는 함수.
  function makeLabelCanvas(baseWidth, size, name) {
    const borderSize = 2; // 텍스트를 렌더링해주는 캔버스의 border 즉, 경계선의 두께를 2px로 할당해놓음
    const font = `${size}px bold sans-serif`; // ctx.font에 할당해 줄 텍스트 스타일 값. 문자열의 순서는 CSS font 속성값과 동일한 구문 순서를 사용함. 전달받은 size값대로 32px로 지정해 줌.
    ctx.font = font;

    // 전달받은 name의 텍스트 길이를 measureText(name)으로 리턴받은 TextMetrics 객체의 width값을 이용해서 예측함. 나중에 캔버스 픽셀의 단위크기의 x방향(즉, 텍스트 width방향)의 scale을 정하는 데 사용할거임.
    const textWidth = ctx.measureText(name).width;

    const doubleBorderSize = borderSize * 2; // 이거는 경계선의 두께니까 width의 양 끝쪽, height의 위아래에 두개씩 추가해줘야 되는거니까 *2를 해준거임
    // const width = ctx.measureText(name).width + doubleBorderSize; // name을 캔버스에 렌더한다고 가정했을때의 width에다가 width의 양끝에 border 두께만큼 2씩 추가해 줌.
    const width = baseWidth + doubleBorderSize; // 텍스트 너비에 따라 명찰의 길이가 제각각인 걸 수정하려고 고정 너비값인 baseWidth값으로 캔버스의 width를 할당하려는 것.
    const height = size + doubleBorderSize; // 폰트 사이즈인 32px 만큼에 height의 양끝에 border 두께만큼 2씩 추가해 줌.
    ctx.canvas.width = width;
    ctx.canvas.height = height; // 위에서 구한 width, height값을 각각 캔버스의 width, height에 할당함.

    ctx.font = font; // 캔버스 해상도가 바뀌면 font를 다시 지정해줘야 한다고 함. 굳이 위에서 지정을 먼저 해준 이유는? 해당 폰트 스타일로 name을 캔버스에 렌더한다고 가정했을때의 width값을 얻고 싶었기 때문이었겠지
    // ctx.textBaseline = 'top'; // 실제 해당 캔버스의 베이스라인은 가만히 있지만, 해당 베이스라인이 top이 됨에 따라 텍스트는 베이스라인 밑에 바싹 붙여서 렌더됨.
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    // 텍스트를 고정너비로 맞춰준 캔버스에 렌더하기 때문에, 길이가 짧은 텍스트라면 그냥 렌더했을 때 캔버스의 한쪽 공간이 남을 수 있음.
    // 이를 방지하기 위해서 텍스트를 렌더링할 때, fillText()로 넘겨주는 x좌표값을 기준으로 텍스트를 가운데정렬 시키려고 하는 것. 
    // 그래서 캔버스의 원점을 캔버스의 가운데 지점으로 옮길거기 때문에, 베이스라인을 top으로 그대로 두면 텍스트가 너무 아래로 쳐져서 렌더되겠지? 그래서 베이스라인도 middle로 바꿔준 것.

    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, width, height); // 위에서 만든 width, height만큼의 사이즈를 가진 파란색 사각형으로 캔버스 전체를 덮어버림 -> 배경을 파랗게 지정한 것.

    /**
     * 고정너비에 맞춰서 텍스트를 렌더링 해주려면, 텍스트의 width가 고정너비보다 작은지, 큰지에 따라 캔버스의 x방향의 단위크기 scale값을 잘 조정해줘야 함.
     * 
     * 1. 텍스트 width가 고정너비보다 크다면, scaleFactor에는 1보다 작은 0.xxx... 값이 들어갈거고,
     * 캔버스 단위크기의 x방향을 0.xxx...px로 축소시켜줘야 텍스트가 약간 x방향으로 짜부되어서 캔버스 고정너비 안에 들어가도록 렌더될거임.
     * (참고로 이 말은, 캔버스의 1px을 렌더링하기 위해 x방향으로는 실제로 0.xxx...개의 픽셀을 사용할 것이라는 의미)
     * 
     * 2. 반면 텍스트 width가 고정너비보다 작다면, scaleFactor에는 1이 들어갈거고,
     * 캔버스 단위크기의 x방향은 원래의 단위크기인 1px 그대로 두니까 텍스트는 비율이나 크기 변화없이 캔버스에 그대로 렌더될거임.
     * (마찬가지로 캔버스의 1px을 렌더링하기 위해 x방향으로 실제 1개의 픽셀을 사용할 것이라는 의미)
     */
    const scaleFactor = Math.min(1, baseWidth / textWidth);
    ctx.translate(width / 2, height / 2); // 앞서 말했듯이 길이가 짧은 텍스트가 한쪽 공간이 남게 렌더되는 경우를 가정하여 x좌표값을 기준으로 center로 정렬되어 렌더될 수 있도록, 원점을 캔버스의 가운데로 일단 옮겨놓음.
    ctx.scale(scaleFactor, 1); // y방향의 단위크기는 그대로 두고, x방향의 단위크기만 텍스트의 너비에 따라 달리 지정해줌.
    ctx.fillStyle = 'white';
    ctx.fillText(name, 0, 0); // 흰색 텍스트로 렌더해 줌. 이때, 원점(즉, 캔버스의 정가운데)를 기준으로 가운데정렬하여 텍스트를 렌더해 줌.

    return ctx.canvas; // name 텍스트가 렌더된 캔버스를 리턴해 줌
  }

  /**
   * 캔버스 하나를 두고 여러 캔버스 텍스처에서 돌려쓰다 보면 발생하는 문제점이 있음.
   * 
   * 1번 예제에서는 하나의 캔버스 텍스처에 하나의 캔버스를 전달해서 매 프레임마다 render 메서드로 렌더링을 해줬잖아.
   * 그렇기 때문에 매 프레임마다 바뀌는 캔버스의 픽셀 데이터값이 render 메서드를 매 프레임마다 호출할 때마다 캔버스 텍스처에 로드되는거지.
   * 1번 예제에서 정리해놓았듯이, canvasTexture.needsUpdate값은 기본값이 true이고, 
   * 그래야만 캔버스 텍스처를 렌더링해서 사용할 때마다 업데이트가 트리거되서 변경된 캔버스 데이터가 해당 캔버스 텍스처에 로드될 테니까.
   * 
   * 그런데 2번 예제에서는 어떻게 되고 있지?
   * 하나의 캔버스를 여러 캔버스 텍스처에서 돌려 쓰고 있고,
   * 해당 캔버스의 픽셀 데이터값이 makeLabelCanvas 함수를 호출할 때마다 매번 수정되고 있지?
   * 그러면 픽셀 데이터가 바뀔때마다 canvasTexture를 render 함수로 렌더링 해주는 식으로 사용해야 바뀐 캔버스 데이터가 캔버스 텍스처로 로드될텐데
   * 픽셀 데이터가 바뀔때마다 렌더링되는게 아니라, animate 함수에서만 렌더링을 해주고 있잖아.
   * 
   * 즉, 1번 예제와는 다르게 makePerson함수를 호출해서 캔버스 데이터가 바뀌는 중간중간마다 렌더링을 해줘서 캔버스 텍스처를 사용하는 과정이 없다는 거지.
   * 이렇게 되면 첫번째, 두번째 makePerson 호출에 의한 캔버스 데이터는 각각의 캔버스 텍스처에 로드되지 않을 것이고,
   * 오로지 세번째 makePerson 호출에 의한 캔버스 데이터만 3개의 캔버스 텍스처 모두에 로드되어버림.
   * -> 이 말은 곧, 3개의 캔버스 텍스처 모두 세번째 캔버스 데이터(즉, Red Menace라는 텍스트가 렌더링된 캔버스)만 렌더해준다는 뜻이 되어버림.
   * 
   * 그래서 그냥 이렇게 코드를 짜서 실행해버리면 세 캐릭터의 명찰 메쉬들이 'Red Menace'로 똑같이 렌더되어 버림.
   * 
   * 이걸 해결하기 위해서는, makePerson 함수 내에서 makeLabelCanvas를 호출하여 캔버스 데이터를 변경해주고,
   * 변경된 캔버스를 전달하여 캔버스 텍스처를 만들었으면, 그 캔버스 텍스처를 중간에 렌더링해주는 작업을 makePerson함수 안에 추가해줘야 함.
   * 
   * 그런데 기존의 씬과 카메라를 이용해서 렌더링 하면 이상하게 렌더가 될테니까
   * 새로운 씬과 카메라를 만들어서, 거기에 해당 캔버스 텍스처를 입힌 새로운 명찰 메쉬를 추가하여 따로 렌더해주면 되겠지! 이때, 새로운 씬, 카메라, 명찰 메쉬는 캔버스 텍스처 개수에 따라 각각 3개씩 생성되겠지
   * 얘내를 렌더해준다고 화면에 다른 씬이 보일 걱정은 안해도 되는게,
   * 원래 씬의 배경색이 투명이 아닌 white고, animate 함수에서 원래 씬을 계속 렌더해줄거기 때문에
   * 새로운 씬들 3개가 초기에 렌더된다고 해도 그 이후부터는 원래 씬만 계속 렌더되서 덮어줄거라는 뜻.
   * 
   * 그래서 아래는 중간에 렌더링을 해주기 위한 즉시실행함수를 만든 것.
   * 1. 먼저 즉시실행함수 내에서는 새로운 명찰 메쉬, 새로운 씬, 새로운 카메라를 만들어놓음.
   * 2. 그리고 내부의 중첩함수를 forceTextureInitialization에 리턴하여 할당해놓음.
   * 3. 이 리턴받은 중첩함수를 makePerson 함수내에서 새롭게 만든 캔버스 텍스처를 전달받아 실행함으로써,
   * 캔버스 텍스처를 새로운 명찰 메쉬의 머티리얼에 할당해주고, 렌더해줘서 변경된 캔버스 데이터를 해당 캔버스 텍스처에 로드해줄 수 있도록 함. 
   */
  const forceTextureInitialization = function () {
    const material = new THREE.MeshBasicMaterial(); // 새로운 베이직-머티리얼 생성
    const geometry = new THREE.PlaneGeometry(); // 새로운 평면 지오메트리 생성
    const scene = new THREE.Scene(); // 새로운 씬 생성
    scene.add(new THREE.Mesh(geometry, material)); // 새로운 명찰 메쉬를 생성하여 새로운 씬에 추가함.
    const camera = new THREE.Camera(); // 새로운 카메라 생성

    // const forceTextureInitialization 에 내부 중첩함수를 리턴해 줌.
    return function forceTextureInitialization(texture) {
      material.map = texture; // makePerson 함수에서 전달받은 변경된 캔버스 픽셀데이터로 만든 캔버스 텍스처를 새로운 머티리얼에 할당함.
      renderer.render(scene, camera); // 캔버스 텍스처를 사용한 장면을 렌더해 줌. -> 해당 캔버스 텍스처에는 변경된 캔버스 데이터가 잘 로드되겠지.
    };
  }();

  // 위에서 만든 공통 지오메트리들과 명찰 캔버스로 캐릭터 메쉬를 만들고 씬에 추가해주는 함수
  function makePerson(x, labelWidth, size, name, color) {
    const canvas = makeLabelCanvas(labelWidth, size, name); // 전달받은 name으로 텍스트를 렌더해 준 명찰 캔버스를 리턴받아 할당해놓음
    const texture = new THREE.CanvasTexture(canvas); // 리턴받은 명찰 캔버스로 캔버스 텍스처를 만듦.

    texture.minFilter = THREE.LinearFilter; // 캔버스 텍스처는 2D이므로 원본보다 작을 경우 linearFilter로 대략적인 픽셀들을 필터링해줌.
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping; // 텍스처 반복 유형은 캔버스 텍스처의 양끝 모서리, 즉 border로 설정한 파란 픽셀 모서리들을 늘여주도록 함
    forceTextureInitialization(texture); // 변경된 캔버스 데이터로 만든 캔버스 텍스처를 중간에 렌더링하여 사용해줌으로써 변경된 캔버스 데이터를 해당 캔버스 텍스처에 로드해주려는 것.

    // 이름표 메쉬에 사용할 베이직-머티리얼
    const labelMaterial = new THREE.MeshBasicMaterial({
      map: texture, // 캔버스 텍스처 할당
      side: THREE.DoubleSide, // 양면 렌더링 지정
      transparent: true // 투명도를 조절할 수 있도록 함.
    });
    // 캐릭터 메쉬에 사용할 퐁-머티리얼
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color, // 전달받은 컬러값으로 지정
      flatShading: true // 물체를 각지게 표현함 
    });

    // 몸체, 머리, 명찰 메쉬들을 자식노드로 두어 같이 움직이게 할 부모노드를 생성함
    const root = new THREE.Object3D();
    root.position.x = x; // 전달받은 x좌표값으로 부모노드의 x좌표값 지정

    // 몸체, 머리, 명찰 메쉬들을 각각 생성해서 부모노드인 root에 추가해 줌
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    root.add(body);
    body.position.y = bodyHeight / 2; // 몸체 길이의 절반만큼(1px) y좌표값을 올려줌.

    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    root.add(head);
    head.position.y = bodyHeight + headRadius * 1.1; // 몸체 길이 + 구체 반지름의 1.1배 (2 + 0.352 = 2.352) 만큼 y좌표값을 올려줌.

    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    root.add(label);
    label.position.y = bodyHeight * 4 / 5; // 몸체 길이의 0.8배 만큼(1.6px) y좌표값을 올려줌
    label.position.z = bodyRadiusTop * 1.01; // 몸체 윗면 반지름의 1.01배 만큼(0.404px) z좌표값을 앞으로 당겨줌.

    // 명찰의 크기를 조정하는데, 일단 명찰의 현재 크기는 평면 지오메트리의 크기를 따라 1*1 사이즈잖아
    // 근데 2D 캔버스랑 비율 자체도 안맞고 사이즈는 더더욱 캔버스가 더 크지
    // 그렇기 때문에, 이대로 렌더해버리면 정사각형 명찰에 캔버스 텍스처 width가 짜부된 형태로 렌더됨.
    // 따라서, canvas.width, height의 각각 0.01배로 축소시킨 값만큼 명찰 메쉬의 x, y 방향의 크기를 조정함으로써
    // 비율과 사이즈를 대략 맞춰준 것.
    const labelBaseScale = 0.01;
    label.scale.x = canvas.width * labelBaseScale;
    label.scale.y = canvas.height * labelBaseScale;

    scene.add(root); // 씬에 최종적으로 부모노드를 추가함
    return root; // 부모노드를 리턴해 줌.
  }

  // makePerson을 호출하여 3개의 캐릭터 및 명찰 메쉬를 만듦
  makePerson(-3, 150, 32, 'Purple People Eater', 'purple');
  makePerson(0, 150, 32, 'Green Machine', 'green');
  makePerson(3, 150, 32, 'Red Menace', 'red');

  // resize renderer
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }

    return needResize;
  }

  // animate
  function animate(t) {
    t *= 0.001; // 밀리초 단위 타임스탬프값을 초 단위로 변환함.

    // 렌더러가 리사이징되면 변경된 사이즈에 맞게 카메라 비율(aspect)도 업데이트 해줌.
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);

    requestAnimationFrame(animate); // 내부에서 반복 호출
  }

  requestAnimationFrame(animate);
}

main();