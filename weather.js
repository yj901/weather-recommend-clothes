lucide.createIcons();

Chart.register(ChartDataLabels);
let myCt = document.getElementById("myChart");
let myChart = new Chart(myCt, {
  type: "line",
  data: {
    labels: ["12시", "15시", "18시", "21시", "24시", "3시"],
    datasets: [
      {
        label: "temp",
        data: [10, 20, 30, 40, 20, 30],
        fill: true,
        backgroundColor: "transparent",
        borderColor: "rgba(255,255,255,0.7)",
        pointBackgroundColor: " white",
        tension: 0.2,
        borderWidth: 1,
        maxBarThickness: 1,
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
        color: "#fff",
        align: "end",
        anchor: "end",
        font: { size: 12 },
        formatter: (v) => v + "°",
      },
    },
    scales: {
      x: {},
    },
  },
});
