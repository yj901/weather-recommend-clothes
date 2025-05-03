//serviceWorker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}

// lucide icon
lucide.createIcons();

import { API_KEY } from "./env.js";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// 기온 아이콘 매핑
const iconMap = {
  "01d": "sun",
  "01n": "moon",
  "02d": "cloud-sun",
  "02n": "cloud-moon",
  "03d": "cloud",
  "03n": "cloud",
  "04d": "cloudy",
  "04n": "cloudy",
  "09d": "cloud-rain",
  "09n": "cloud-rain",
  "10d": "cloud-sun-rain",
  "10n": "cloud-moon-rain",
  "11d": "cloud-lightning",
  "11n": "cloud-lightning",
  "13d": "snowflake",
  "13n": "snowflake",
  "50d": "waves",
  "50n": "waves",
};

const time3time = [];
const time3temp = [];

// 현재 기온
const getCurrentWeather = async (lat, lon) => {
  const URL = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`;

  const res = await fetch(URL);
  const data = await res.json();

  // console.log(data);
  const currentTemp = document.querySelector("#current-temp");
  const weatherDesc = document.querySelector("#weather-desc");

  const currentIcon = document.querySelector("#current-icon");
  const iconCode = data.weather[0].icon;
  const iconName = iconMap[iconCode];
  currentIcon.setAttribute("data-lucide", iconName);
  lucide.createIcons();

  currentTemp.innerHTML = Number(data.main.temp).toFixed(0) + "°";
  weatherDesc.innerText = data.weather[0].description;
};

// 3시간 5일 예보
const getForecastWeather = async (lat, lon) => {
  const URL = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`;

  const res = await fetch(URL);
  const data = await res.json();

  const { list } = data;

  const weatherWeek = {};
  list.map((item) => {
    const date = new Date(item.dt * 1000);
    const options = { weekday: "short", month: "short", day: "numeric" };
    const formattedDate = date.toLocaleDateString("ko-KR", options);

    if (!weatherWeek[formattedDate]) {
      weatherWeek[formattedDate] = {
        count: 0,
        temp: [],
        tempMax: 0,
        tempMin: 0,
        icons: [],
        icon: null,
      };
    }
    weatherWeek[formattedDate].count += 1;
    weatherWeek[formattedDate].temp.push(item.main.temp);
    weatherWeek[formattedDate].temp.sort((a, b) => a - b);
    weatherWeek[formattedDate].icons.push(item.weather[0].icon);
  });

  //최고기온, 최저기온, 아이콘
  Object.keys(weatherWeek).map((date) => {
    const weatherInfo = weatherWeek[date];
    weatherInfo.tempMin = Number(weatherInfo.temp.slice(0, 1)[0].toFixed(0));
    weatherInfo.tempMax = Number(
      weatherInfo.temp.slice(weatherInfo.count - 1)[0].toFixed(0)
    );

    weatherInfo.icon = weatherInfo.icons
      .slice(
        Math.round(weatherInfo.count / 2) - 1,
        Math.round(weatherInfo.count / 2)
      )
      .join();
  });

  //이번주 날씨 출력
  const weekLists = document.querySelector("#week-lists");
  weekLists.innerHTML = ``;

  Object.entries(weatherWeek).forEach((week) => {
    const dates = week[0].split(" ");
    const date = dates.slice(0, 2).join(" ");
    const day = dates.slice(2, 3).join().replace(/[()]/g, "");

    const iconName = iconMap[week[1].icon];

    const weekList = document.createElement("li");
    weekList.innerHTML = `
            <li class="flex flex-col justify-center items-center gap-[8px]">
              <div class="flex flex-col items-center text-[12px] md:text-[13px]">
                <span>${date}</span>
                <span class="leading-none">${day}</span>
              </div>
              <i data-lucide="${iconName}" class="size-[30px] lg:size-[35px]"></i>
              <h5 class="text-[12px]">${week[1].tempMin}° / ${week[1].tempMax}°</h5>
            </li>
          `;
    weekLists.appendChild(weekList);
    lucide.createIcons();
  });

  //오늘 최저, 최고 기온 출력
  const todayData = Object.entries(weatherWeek)[0];
  const todayHighTemp = todayData[1].tempMax;
  const todayRowTemp = todayData[1].tempMin;

  const highElement = document.querySelector("#highTemp span");
  const rowElement = document.querySelector("#rowTemp span");
  highElement.innerText = todayHighTemp;
  rowElement.innerText = todayRowTemp;

  recommendClothes(todayHighTemp);

  //3시간별 온도 배열 넣기
  time3time.length = 0;
  time3temp.length = 0;
  list.slice(0, 6).map((item) => {
    const date = new Date(item.dt * 1000);
    const time3hour = date.getHours() + "시";
    const time3Temp = Math.round(item.main.temp);
    time3time.push(time3hour);
    time3temp.push(time3Temp);
  });
  drawChart(time3time, time3temp);
};

//현재 위치값 및 실행
const getPosition = (position) => {
  const { latitude, longitude } = position.coords;
  getCurrentWeather(latitude, longitude);
  getForecastWeather(latitude, longitude);

  //1분마다 업데이트
  setInterval(() => {
    getCurrentWeather(latitude, longitude);
    getForecastWeather(latitude, longitude);
  }, 1000 * 60);

  // kakao map api
  var geocoder = new kakao.maps.services.Geocoder();
  var coord = new kakao.maps.LatLng(latitude, longitude);

  var callback = function (result, status) {
    if (status === kakao.maps.services.Status.OK) {
      const region1 = result[0].region_1depth_name;
      const region2 = result[0].region_2depth_name;
      const regionText = `${region1} ${region2}`;
      const regionArea = document.querySelector("#current-region");
      regionArea.innerText = regionText;
    }
  };

  geocoder.coord2RegionCode(coord.getLng(), coord.getLat(), callback);
};

const errorHandle = (error) => {
  console.error(error);
};

if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(getPosition, errorHandle);
} else {
  console.log("Geolocation is not available.");
}

let chartInstance = null;

// 3시간 기온 차트 Chart.js
Chart.register(ChartDataLabels);
const timeCt = document.getElementById("timeChart");
const drawChart = (timeData, tempData) => {
  if (chartInstance) {
    chartInstance.destroy(); // 기존 차트 제거
  }
  const tempSort = [...tempData].sort((a, b) => a - b);
  const rowTemp = Number(tempSort[0]);
  const highTemp = Number(tempSort[tempSort.length - 1]);

  const ctx = document.getElementById("timeChart").getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 180);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.6, "rgba(255,255,255,0.1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  chartInstance = new Chart(timeCt, {
    type: "line",
    data: {
      labels: timeData,
      datasets: [
        {
          label: "temp",
          data: tempData,
          fill: true,
          backgroundColor: gradient,
          borderColor: "rgba(255,255,255,0.7)",
          pointBackgroundColor: " white",
          pointRadius: 2,
          tension: 0.2,
          borderWidth: 1,
          cubicInterpolationMode: "default",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        datalabels: {
          clip: false,
          color: "#fff",
          align: "end",
          anchor: "end",
          font: { size: 14 },
          formatter: (v) => v + "°",
        },
      },
      scales: {
        x: {
          border: {
            display: false,
          },
          grid: {
            drawTicks: false,
            display: false,
            drawBorder: false,
          },
          ticks: {
            color: "#fff",
            padding: 8,
            font: {
              size: 13,
            },
          },
        },
        y: {
          beginAtZero: false,
          suggestedMin: rowTemp - 5, // 최저보다 살짝 낮게 -5
          suggestedMax: highTemp + 5, // 최고보다 살짝 높게 +5
          border: {
            display: false,
          },
          grid: {
            drawTicks: false,
            display: false,
            drawBorder: false,
          },
          ticks: {
            display: false,
          },
        },
      },
    },
  });
};

//4계절 배경
const getSeason = (month) => {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
};

const month = new Date().getMonth() + 1;
const season = getSeason(month);

const bgMap = {
  spring: "./imgs/bg_spring.jpg",
  summer: "./imgs/bg_summer.jpg",
  autumn: "./imgs/bg_autumn.jpg",
  winter: "./imgs/bg_winter.jpg",
};
document.querySelector("#bg").style.backgroundImage = `url(${bgMap[season]})`;

// 오늘의 옷 추천
const recommendClothes = (highTemp) => {
  const clothesDB = "./clothes_by_temp.json";
  fetch(clothesDB)
    .then((res) => res.json())
    .then((data) => {
      const matched = data.find(
        (item) => item.min <= highTemp && item.max >= highTemp
      );
      const randomIndex = parseInt(Math.random() * matched.items.length);

      const clothesWrap = document.querySelector("#clothesWrap");
      clothesWrap.innerHTML = `
              <img
                src="${matched.items[randomIndex].img}"
                alt="clothesImg"
                class="h-full"
              />
      `;

      const tempRange = document.querySelector("#temp-range");
      const desc = document.querySelector("#recommend-desc span");
      tempRange.innerText = matched.range;
      desc.innerText = matched.description;
    });
};
