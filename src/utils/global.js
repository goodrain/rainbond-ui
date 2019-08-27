import styles from "./utils.less";
import moment from "moment";

const global = {
  getCurrTeamName() {
    const reg = /team\/([^\/]+)/;
    const hash = location.hash || "";
    const match = hash.match(reg);
    if (match) {
      return match[1];
    }
    return "";
  },
  getCurrRegionName() {
    const reg = /region\/([^\/]+)/;
    const hash = location.hash || "";
    const match = hash.match(reg);
    if (match) {
      return match[1];
    }
    return "";
  },
  fetchStateColor(status) {
    const statusColorMap = {
      RUNNING: "#00D777", //运行中 绿色
      running: "#00D777", //运行中 绿色
      starting: "#F69D4A", //启动中
      Starting: "#F69D4A", //启动中
      NOTREADY: "#F69D4A", //未就绪
      checking: "F69D4A", //检测中
      SCHEDULING: "#F69D4A", //检测中
      stopping: "#20124A", //关闭中 紫色
      Stopping: "#20124A", //关闭中 紫色
      unusual: "#CD0200", //异常 纯红
      ABNORMAL: "#CD0200", //异常 纯红
      closed: "#000021", //已关闭 黑色
      Closed: "#000021", //已关闭 黑色
      undeploy: "#708090", //未部署 石板灰
      Undeploy: "#708090", //未部署 石板灰
      Unknow: "#CD0200", //未知深粉色
      unknow: "#CD0200", //未知/深粉色
      Creating: "#778899", //部署中 浅石板灰
      creating: "#778899", //部署中 浅石板灰
      Third_party: "#5BB2FA",
      Internet: "#5BB2FA", //蓝色
      TheInternet: "#5BB2FA", //蓝色
      Abnormal: "#CD0200", //不正常,纯红
      abnormal: "#CD0200", //不正常,纯红
      Build_failure: "#CD0200", //构建失败 纯红
      build_failure: "#CD0200", //构建失败 纯红
      Upgrade: "#00FF4A", //升级中
      upgrade: "#00FF4A", //升级中
      expired: "#CD0200", //过期 猩红
      Expired: "#CD0200", //猩红

      INITIATING: "#F69D4A",
      TEMINATING: "#20124A", //关闭中 紫色
      tEMINATING: "#20124A", //关闭中 紫色
      Some_abnormal: "#FF0000", //一些不正常 纯红
      Building: "#007710" //构建  纯蓝
    };
    return statusColorMap[status] || statusColorMap.unknow;
  },
  fetchSvg(type) {
    const svgType = {
      runTime: (
        <svg
          t="1565779224563"
          className={styles.icon}
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="1204"
          width="16"
          height="16"
        >
          <path
            d="M510.138182 143.592727h-3.258182A365.149091 365.149091 0 0 0 139.636364 513.163636a380.509091 380.509091 0 0 0 376.087272 375.156364h3.490909A365.149091 365.149091 0 0 0 884.363636 518.749091 379.810909 379.810909 0 0 0 510.138182 143.592727zM744.727273 748.450909a319.767273 319.767273 0 0 1-229.236364 93.090909A333.730909 333.730909 0 0 1 186.181818 512 318.603636 318.603636 0 0 1 506.88 190.138182h3.025455A333.265455 333.265455 0 0 1 837.818182 518.981818a318.138182 318.138182 0 0 1-93.090909 229.469091z"
            p-id="1205"
          />
          <path
            d="M605.090909 535.272727h-93.090909v-186.181818a23.272727 23.272727 0 0 0-46.545455 0v209.454546a23.272727 23.272727 0 0 0 23.272728 23.272727h116.363636a23.272727 23.272727 0 0 0 0-46.545455z"
            p-id="1206"
          />
        </svg>
      ),
      distributionMemory: (
        <svg
          t="1565779336591"
          className={styles.icon}
          viewBox="0 0 1099 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="1890"
          width="16"
          height="16"
        >
          <path
            d="M841.66 313.7 676.06 189.2c-3.7-2.8-8.1-4.3-12.7-4.3L277.56 185c-8.5 0-16.7 5.9-16.7 16.8l0 618.8c0 13.9 12 27.2 27.3 27.2l552.2 0c8.8 0 14.8-4.3 14.8-14.2L855.16 330.1C855.06 323.4 847.06 317.7 841.66 313.7zM682.36 257.7l0 124.5c0 4.9-2.4 9.2-7.8 9.2l-262 0c-7.2 0-8.2-3.8-8.2-9.5l0-145.1 248.4 0L682.36 257.7zM804.66 778.6c0 10.7-6.5 18-16.9 18l-461 0c-8.1 0.1-13.5-5.8-13.5-14.5L313.26 248.4c0-7.1 6.6-11.5 15.3-11.5 7.5 0 17 0 27.7 0l0.1 190.4c0 6.9 4.3 10.1 10.8 10.1l346.1-0.1c6.8 0.1 10.7-5 10.5-12.7l0.1-135.2 80.8 60.4L804.66 778.6zM371.56 621.2l188.7 0c6.7 0 11.2-4.3 11.2-10.4 0-5.2 0-20.1 0-25.7 0-6.6-7-10.8-13.2-10.8L370.16 574.3c-7.8 0-11.7 4.9-11.7 10.8 0 6.4 0 21.7 0 25.4C358.46 616.5 363.16 621.2 371.56 621.2zM709.86 574.3l-95 0c-8.2 0-14.1 4.7-14.1 11.3 0 4.7 0 19 0 23.8 0 8.1 6.3 11.9 13.6 11.9l94.3 0c8.4 0 15.2-5.9 15.2-13.2 0-6.2 0-11.8 0-18.9C723.96 581.2 718.46 574.3 709.86 574.3zM480.06 698.5 371.76 698.5c-8.3 0-13.4 4.3-13.4 13.3 0 6 0 12.2 0 17.3 0 8.9 5.4 14.4 13.7 14.4l105.6 0c7.9 0 15.1-5.3 15.1-14 0-6.7 0-11.6 0-16.3C492.76 705 486.06 698.5 480.06 698.5zM709.06 698.5 533.56 698.5c-8.9 0-14.2 6.5-14.2 14.1 0 4.4 0 12.5 0 17.3 0 6.2 5.6 13.6 14.5 13.6l174 0c8.9 0 16-6.3 16-15.4 0-4.1 0-8.7 0-14.9C723.96 704.8 718.66 698.5 709.06 698.5zM627.46 360.4c7.3 0 13.2-6.1 13.2-11.4L640.66 277.4c0-7.4-4.1-11.5-10.3-11.5-5.1 0-24.9 0-29.3 0-6.2 0-9.2 4.5-9.2 11.4l0 71.9c0 6.4 6.3 11.3 11.9 11.3C608.56 360.4 622.06 360.4 627.46 360.4z"
            p-id="1891"
          />
        </svg>
      ),
      useDisk: (
        <svg
          style={{ marginRight: "6px" }}
          t="1566640777774"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="20451"
          width="15"
          height="14"
        >
          <path
            d="M615.7 82H67v860h890V368.4L615.7 82z m-317.1 50h298.9l2.1 1.7v214.9h-301V132zM724 892H298.6V642.6H724V892z m183 0H774V592.6H248.6V892H117V132h131.6v266.6h401v-223l257.5 216V892zM353.1 192.1h50v80h-50v-80z"
            p-id="20452"
          />
        </svg>
      ),
      version: (
        <svg
          t="1565853114924"
          className={styles.icon}
          viewBox="0 0 1184 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="6049"
          width="16"
          height="16"
        >
          <path
            d="M448.576 576l118.272 0q-8 90.272-56.288 142.016t-122.56 51.712q-92.576 0-145.44-66.272t-52.864-180.576q0-110.848 53.152-178.016t133.152-67.136q84.576 0 132.576 49.728t55.424 141.152l-116 0q-2.848-36.576-20.288-56.576t-46.56-20q-32.576 0-50.56 34.56t-18.016 101.44q0 27.424 2.848 48t10.272 39.712 22.848 29.44 37.728 10.272q54.272 0 62.272-79.424zM855.424 576l117.728 0q-8 90.272-56 142.016t-122.272 51.712q-92.576 0-145.44-66.272t-52.864-180.576q0-110.848 53.152-178.016t133.152-67.136q84.576 0 132.576 49.728t55.424 141.152l-116.576 0q-2.272-36.576-20-56.576t-46.272-20q-32.576 0-50.56 34.56t-18.016 101.44q0 27.424 2.848 48t10.272 39.712 22.56 29.44 37.44 10.272q28 0 43.712-21.728t19.136-57.728zM1060.576 508q0-118.272-8.864-175.424t-34.56-92q-3.424-4.576-7.712-8t-12.288-8.576-9.152-6.272q-49.152-36-398.272-36-357.152 0-405.728 36-2.848 2.272-10.016 6.56t-12 8-8.288 8.288q-25.728 34.272-34.272 91.136t-8.576 176.288q0 118.848 8.576 175.712t34.272 91.712q3.424 4.576 8.576 8.576t11.712 8 10.016 6.848q25.152 18.848 136.864 28t268.864 9.152q348.576 0 398.272-37.152 2.848-2.272 9.728-6.272t11.712-8 7.712-9.152q26.272-34.272 34.848-90.848t8.576-176.576zM1170.272 73.152l0 877.728-1170.272 0 0-877.728 1170.272 0z"
            p-id="6050"
          />
        </svg>
      ),
      warehouse: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 17 17"
          className={styles.icon}
        >
          <circle
            cx="8.51"
            cy="8.5"
            r="3.5"
            fill="none"
            stroke="#9d9d9d"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
          />
          <path
            d="M16.5 8.5h-4.49m-7 0H.5"
            fill="none"
            stroke="#9d9d9d"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
          />
        </svg>
      ),
      basicInfo: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 17 17"
          className={styles.icon}
        >
          <circle
            cx="3.8"
            cy="3.2"
            r="1.7"
            fill="none"
            stroke="#9d9d9d"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
          />
          <path
            d="M6.75 15.5s1.95-1.95 1.95-1.98H6.3s-2.48.15-2.48-2.46V4.92m2.93 6.64s1.95 1.95 1.95 1.97"
            fill="none"
            stroke="#9d9d9d"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
          />
          <g
            fill="none"
            stroke="#9d9d9d"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
          >
            <circle cx="13.2" cy="13.8" r="1.7" />
            <path d="M10.25 1.5S8.3 3.45 8.3 3.47h2.4s2.48-.15 2.48 2.46v6.14m-2.93-6.63S8.3 3.49 8.3 3.47" />
          </g>
        </svg>
      ),
      branch: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 17 17"
          className={styles.icon}
        >
          <circle
            cx="4.94"
            cy="2.83"
            r="1.83"
            fill="none"
            stroke="#9d9d9d"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
          />
          <circle
            cx="11.78"
            cy="5.15"
            r="1.83"
            fill="none"
            stroke="#9d9d9d"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
          />
          <circle
            cx="4.98"
            cy="14.17"
            r="1.83"
            fill="none"
            stroke="#9d9d9d"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
          />
          <path
            d="M11.78 6.99s.09 2.68-1.9 3.38c-1.76.62-2.92-.04-4.93 1.97V4.66"
            fill="none"
            stroke="#9d9d9d"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
          />
        </svg>
      ),
      logState: (
        <svg
          className={styles.icon}
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="26201"
          width="16"
          height="16"
        >
          <path
            d="M951.509333 507.2L465.194667 993.514667c-0.682667 1.024-1.130667 2.176-2.026667 3.072a20.8 20.8 0 0 1-15.253333 5.994666 20.8 20.8 0 0 1-15.253334-5.994666c-0.896-0.896-1.322667-2.048-2.026666-3.072L73.066667 635.946667c-1.024-0.682667-2.154667-1.130667-3.072-2.026667A20.8 20.8 0 0 1 64 618.666667a20.693333 20.693333 0 0 1 5.994667-15.253334c0.917333-0.896 2.048-1.322667 3.072-2.026666L559.381333 115.093333A20.906667 20.906667 0 0 1 575.914667 106.666667h86.528c2.837333-32.042667 15.914667-60.16 35.626666-78.570667l0.341334 0.384c4.181333-4.416 9.877333-7.146667 16.170666-7.146667 12.629333 0 22.869333 10.922667 22.869334 24.384 0 8-3.84 14.741333-9.408 19.178667-10.218667 9.429333-17.493333 24.298667-19.925334 41.770667h102.464c6.826667 0 12.672 3.413333 16.533334 8.426666l124.373333 124.373334a20.992 20.992 0 0 1 8.426667 16.554666V490.666667a20.906667 20.906667 0 0 1-8.405334 16.533333z m-220.757333-151.658667a22.101333 22.101333 0 0 1-16.170667 7.125334c-12.629333 0-22.826667-10.922667-22.826666-24.384 0-8 3.84-14.741333 9.408-19.2 5.290667-4.885333 9.621333-11.456 13.162666-18.837334-18.24 4.864-31.744 21.333333-31.744 41.066667a42.666667 42.666667 0 0 0 85.333334 0c0-10.090667-3.626667-19.221333-9.493334-26.538667-13.12 33.002667-27.669333 40.768-27.669333 40.768z m186.496-91.413333L802.453333 149.333333h-89.877333c3.712 9.472 9.045333 17.536 15.466667 23.466667 0.874667 0.704 1.962667 1.130667 2.709333 1.962667l0.384-0.384c22.208 20.757333 36.8 53.504 36.8 90.752 0 0.896-0.213333 1.685333-0.256 2.56 25.536 14.741333 42.922667 42.026667 42.922667 73.642666a85.333333 85.333333 0 0 1-170.666667 0 85.141333 85.141333 0 0 1 81.493333-84.949333c-1.92-18.944-9.408-35.157333-20.245333-45.184-0.874667-0.704-1.962667-1.130667-2.752-1.962667l-0.341333 0.384C682.218667 194.794667 670.506667 173.674667 664.96 149.333333h-80.917333l-469.333334 469.333334 333.205334 333.205333 469.333333-469.333333V264.128zM304.682667 582.08a20.842667 20.842667 0 0 1 29.461333 0l150.378667 150.378667a20.842667 20.842667 0 0 1-29.461334 29.461333l-150.378666-150.378667a20.842667 20.842667 0 0 1 0-29.461333z m85.333333-85.333333a20.842667 20.842667 0 0 1 29.461333 0l150.357334 150.378666a20.842667 20.842667 0 0 1-29.461334 29.461334l-150.357333-150.378667a20.842667 20.842667 0 0 1 0-29.461333z"
            fill=""
            p-id="26202"
          />
        </svg>
      ),
      createTime: (
        <svg
          t="1565853415564"
          className={styles.icon}
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="17300"
          width="16"
          height="16"
        >
          <path
            d="M787.15 847.45H234.71a48.92 48.92 0 0 1-48.85-48.86V228a48.91 48.91 0 0 1 48.85-48.85h552.44A48.91 48.91 0 0 1 836 228v570.59a48.92 48.92 0 0 1-48.85 48.86zM234.71 195.19A32.89 32.89 0 0 0 201.86 228v570.59a32.89 32.89 0 0 0 32.85 32.86h552.44A32.89 32.89 0 0 0 820 798.59V228a32.89 32.89 0 0 0-32.85-32.85z"
            fill=""
            p-id="17301"
          />
          <path
            d="M836 364.29H185.86V228a48.91 48.91 0 0 1 48.85-48.85h552.44A48.91 48.91 0 0 1 836 228z m-634.14-16H820V228a32.89 32.89 0 0 0-32.85-32.85H234.71A32.89 32.89 0 0 0 201.86 228z"
            fill=""
            p-id="17302"
          />
          <path
            d="M348.92 121.08h16V250.6h-16zM672.03 121.08h16V250.6h-16zM483.31 677.22H355.84l16.78-14.12c26.14-22 93.18-88.53 89.48-131.62-1-12.15-7.67-21.64-20.27-29-29-17.39-62.07 9.22-62.4 9.49l-10.13-12.36c1.71-1.4 42.25-33.94 80.68-10.88 17.09 10 26.56 23.91 28.06 41.39 3.95 46-51.36 104.55-79.45 131.1h84.72zM567.94 679.35c-12.72 0-26.9-1.92-42.31-5.77l3.88-15.53c32.93 8.24 59.62 6.76 75.14-4.16 10-7 15.57-17.86 17.1-33.13 1.67-16.67-1.85-28.64-10.76-36.58-20.83-18.56-64.25-9.38-64.69-9.28l-11.17 2.43 1.54-11.33 11.16-81.82h88.69v16h-74.73L554 557.52c16.65-1.92 48.1-2.69 67.63 14.69 12.85 11.42 18.25 28.3 16.07 50.14-2 19.9-10 34.91-23.82 44.63-11.72 8.23-27.26 12.37-45.94 12.37z"
            fill=""
            p-id="17303"
          />
        </svg>
      ),
      currentVersion: (
        <svg
          style={{
            cursor: "pointer"
          }}
          t="1566532978509"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="10598"
          width="16"
          height="16"
        >
          <path
            d="M512 42.666667C251.733333 42.666667 42.666667 251.733333 42.666667 512s209.066667 469.333333 469.333333 469.333333 469.333333-209.066667 469.333333-469.333333S772.266667 42.666667 512 42.666667z m0 874.666666C288 917.333333 106.666667 736 106.666667 512S288 106.666667 512 106.666667s405.333333 181.333333 405.333333 405.333333-181.333333 405.333333-405.333333 405.333333z"
            p-id="10599"
            fill="#1296db"
          />
          <path
            d="M544 279.466667c-10.666667 10.666667-14.933333 23.466667-14.933333 40.533333 0 12.8 4.266667 23.466667 12.8 32 8.533333 8.533333 19.2 12.8 32 12.8 10.666667 0 23.466667-2.133333 38.4-17.066667 10.666667-10.666667 14.933333-25.6 14.933333-40.533333 0-12.8-4.266667-23.466667-12.8-32-19.2-19.2-51.2-17.066667-70.4 4.266667zM556.8 644.266667c-14.933333 14.933333-25.6 23.466667-34.133333 29.866666 4.266667-19.2 12.8-57.6 34.133333-130.133333 21.333333-72.533333 23.466667-87.466667 23.466667-91.733333 0-10.666667-4.266667-21.333333-12.8-27.733334-17.066667-14.933333-49.066667-12.8-87.466667 10.666667-21.333333 12.8-44.8 32-68.266667 59.733333l-12.8 14.933334 44.8 34.133333 10.666667-10.666667c12.8-12.8 21.333333-19.2 25.6-25.6-34.133333 110.933333-49.066667 179.2-49.066667 209.066667 0 14.933333 4.266667 25.6 12.8 34.133333 8.533333 8.533333 19.2 12.8 32 12.8s27.733333-4.266667 44.8-14.933333c17.066667-8.533333 40.533333-29.866667 74.666667-61.866667l12.8-12.8-40.533333-38.4-10.666667 8.533334z"
            p-id="10600"
            fill="#1296db"
          />
        </svg>
      ),
      upgrade: (
        <svg
          style={{
            cursor: "pointer"
          }}
          t="1566533552365"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="11396"
          width="16"
          height="16"
        >
          <path
            d="M512 57.6c249.6 0 454.4 204.8 454.4 454.4s-204.8 454.4-454.4 454.4S57.6 761.6 57.6 512 262.4 57.6 512 57.6M512 0C230.4 0 0 230.4 0 512s230.4 512 512 512 512-230.4 512-512-230.4-512-512-512z"
            p-id="11397"
            fill="#cccccc"
          />
          <path
            d="M326.4 492.8l160-160v428.8c0 19.2 12.8 32 32 32s32-12.8 32-32V332.8l160 160c12.8 12.8 32 12.8 44.8 0s12.8-32 0-44.8L531.2 243.2s-6.4-6.4-12.8-6.4h-25.6c-6.4 0-6.4 6.4-12.8 6.4L281.6 448c-12.8 12.8-12.8 32 0 44.8s32 12.8 44.8 0z"
            p-id="11398"
            fill="#cccccc"
          />
        </svg>
      ),
      rollback: (
        <svg
          style={{
            cursor: "pointer"
          }}
          t="1566533701108"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="14118"
          width="16"
          height="16"
        >
          <path
            d="M416 640V384H512v185.6l115.2 32-25.6 89.6-185.6-51.2zM512 102.4c243.2 0 448 198.4 448 448s-198.4 448-448 448-448-198.4-448-448c0-89.6 19.2-172.8 76.8-243.2l64 44.8c-38.4 57.6-57.6 128-57.6 198.4 0 198.4 166.4 364.8 364.8 364.8s364.8-166.4 364.8-364.8S710.4 185.6 512 185.6v102.4L326.4 147.2 512 0v102.4z"
            p-id="14119"
            fill="#cccccc"
          />
        </svg>
      ),
      delete: (
        <svg
          style={{
            cursor: "pointer"
          }}
          t="1566533607654"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="11648"
          width="16"
          height="16"
        >
          <path
            d="M950.857143 219.428571h-182.857143V73.142857h-512v146.285714H73.142857v73.142858h109.714286v658.285714h658.285714V292.571429H950.857143V219.428571zM329.142857 146.285714h365.714286v73.142857h-365.714286V146.285714z m438.857143 731.428572h-512V292.571429h146.285714v438.857142h73.142857V292.571429h73.142858v438.857142h73.142857V292.571429h146.285714v585.142857z"
            p-id="11649"
            fill="#cccccc"
          />
        </svg>
      ),
      success: (
        <svg
          className={styles.icon}
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="31270"
          width="16"
          height="16"
        >
          <path
            d="M927.97968 108.360629a50.575037 50.575037 0 0 0-69.085501 18.517689l-391.898737 678.933747-316.000056-182.409708A50.575037 50.575037 0 0 0 100.427574 711.005546l359.812488 207.690002a50.553362 50.553362 0 0 0 69.078276-18.517689L946.504593 177.44613a50.575037 50.575037 0 0 0-18.524913-69.085501z"
            fill="#46AF60"
            p-id="31271"
          />
        </svg>
      ),
      error: (
        <svg
          className={styles.icon}
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="32079"
          width="16"
          height="16"
        >
          <path
            d="M 909.812 962.028 c -13.094 0 -26.188 -4.996 -36.179 -14.987 L 73.958 147.368 c -19.98 -19.98 -19.98 -52.378 0 -72.359 c 19.983 -19.98 52.38 -19.98 72.36 0 L 945.99 874.683 c 19.981 19.981 19.981 52.378 0 72.36 c -9.99 9.99 -23.084 14.985 -36.179 14.985 Z"
            fill="#db4545"
            p-id="32080"
          />
          <path
            d="M 110.138 962.028 c -13.094 0 -26.188 -4.996 -36.179 -14.987 c -19.98 -19.98 -19.98 -52.378 0 -72.359 L 873.632 75.01 c 19.982 -19.98 52.377 -19.98 72.36 0 c 19.98 19.981 19.98 52.378 0 72.36 L 146.316 947.041 c -9.99 9.99 -23.084 14.986 -36.179 14.986 Z"
            fill="#db4545"
            p-id="32081"
          />
        </svg>
      ),
      close: (
        <svg
          className={styles.icon}
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="43063"
          width="16"
          height="16"
        >
          <path
            d="M511.998049 66.069397c-246.273427 0-445.926662 199.653235-445.926662 445.926462s199.653035 445.931458 445.926662 445.931458c246.296411 0 445.926462-199.658032 445.926462-445.931458S758.29446 66.069397 511.998049 66.069397zM511.998049 920.100164c-225.395582 0-408.104305-182.709523-408.104305-408.104305 0-225.395582 182.708723-408.105305 408.104305-408.105305 225.41357 0 408.125291 182.709723 408.125291 408.105305C920.12334 737.410428 737.411619 920.100164 511.998049 920.100164zM816.163025 803.452451 233.172693 196.400632l-25.336822 23.633976 583.593923 607.556477L816.163025 803.452451z"
            p-id="43064"
            fill="#9d9d9d"
          />
        </svg>
      )
    };
    return svgType[type] || type;
  },

  fetchStateBJColor(status) {
    const statusColorMap = {
      running:
        "linear-gradient(to right, #00D777 0, #00D777 10px, #fff 10px, #fff 100%) no-repeat", //运行中 绿色
      starting:
        "linear-gradient(to right, #F69D4A 0, #F69D4A 10px, #fff 10px, #fff 100%) no-repeat", //启动中
      checking:
        "linear-gradient(to right, #F69D4A 0, #F69D4A 10px, #fff 10px, #fff 100%) no-repeat", //检测中
      stopping:
        "linear-gradient(to right, #20124A 0, #20124A 10px, #fff 10px, #fff 100%) no-repeat", //关闭中 紫色
      unusual:
        "linear-gradient(to right, #CD0200 0, #CD0200 10px, #fff 10px, #fff 100%) no-repeat", //异常
      closed:
        "linear-gradient(to right, #000021 0, #000021 10px, #fff 10px, #fff 100%) no-repeat", //已关闭
      undeploy:
        "linear-gradient(to right, #708090 0, #708090 10px, #fff 10px, #fff 100%) no-repeat", //未部署 石板灰
      unKnow:
        "linear-gradient(to right, #CD0200 0, #CD0200 10px, #fff 10px, #fff 100%) no-repeat", //未知
      upgrade:
        "linear-gradient(to right, #00FF4A 0, #00FF4A 10px, #fff 10px, #fff 100%) no-repeat", //升级中
      creating:
        "linear-gradient(to right, #778899 0, #778899 10px, #fff 10px, #fff 100%) no-repeat", //部署中
      expired:
        "linear-gradient(to right, #CD0200 0, #CD0200 10px, #fff 10px, #fff 100%) no-repeat" //过期
    };
    return statusColorMap[status] || statusColorMap.unKnow;
  },

  fetchStateText(state) {
    const statusColorMap = {
      RUNNING: "运行中",
      running: "运行中",
      starting: "启动中",
      checking: "检测中",
      stopping: "关闭中",
      unusual: "运行异常",
      closed: "已关闭",
      undeploy: "未部署",
      unKnow: "未知",
      ABNORMAL: "运行异常",
      TEMINATING: "关闭中",
      INITIATING: "初始化中",
      SCHEDULING: "调度中",
      TheInternet: "未知",
      upgrade: "升级中",
      creating: "部署中",
      expired: "过期",
      NOTREADY: "未就绪"
    };
    return statusColorMap[state] || statusColorMap.TheInternet;
  },
  fetchTime(value) {
    let second = value; //时间差的毫秒数
    let result = "";

    //计算出相差天数
    let days = Math.floor(second / (24 * 3600 * 1000));

    //计算出小时数

    let leave1 = second % (24 * 3600 * 1000); //计算天数后剩余的毫秒数
    let hours = Math.floor(leave1 / (3600 * 1000));
    //计算相差分钟数
    let leave2 = leave1 % (3600 * 1000); //计算小时数后剩余的毫秒数
    let minutes = Math.floor(leave2 / (60 * 1000));

    //计算相差秒数
    let leave3 = leave2 % (60 * 1000); //计算分钟数后剩余的毫秒数
    let seconds = Math.round(leave3 / 1000);

    if (days && days >= 1) {
      result += days + "天";
    }
    if (hours && hours >= 1) {
      result += hours + "小时";
    }

    if (minutes && minutes >= 1) {
      result += minutes + "分钟";
    }

    if (seconds && seconds >= 1) {
      result += seconds + "秒";
    }
    return result ? result : "1秒";
  },
  fetchdayTime(date) {
    let second = Date.parse(new Date()) - new Date(date).getTime();
    //计算出相差天数
    let days = Math.floor(second / (24 * 3600 * 1000));
    //计算出小时数

    let leave1 = second % (24 * 3600 * 1000); //计算天数后剩余的毫秒数
    let hours = Math.floor(leave1 / (3600 * 1000));
    //计算相差分钟数
    let leave2 = leave1 % (3600 * 1000); //计算小时数后剩余的毫秒数
    let minutes = Math.floor(leave2 / (60 * 1000));

    //计算相差秒数
    let leave3 = leave2 % (60 * 1000); //计算分钟数后剩余的毫秒数
    let seconds = Math.round(leave3 / 1000);

    let result = "";
    if (days && days > 7) {
      result = moment(date).format("YYYY-MM-DD");
    } else if (days && days >= 1 && days < 7) {
      result += days + "天前";
    } else if (hours && hours >= 1 && hours <= 23) {
      result += hours + "小时前";
    } else if (minutes && minutes >= 1 && minutes <= 59) {
      result += minutes + "分钟前";
    } else if (seconds && seconds >= 1 && seconds <= 59) {
      result += seconds + "秒前";
    } else {
      result = "1秒前";
    }
    return result;
  },

  fetchStateOptTypeText(state) {
    const statusOptType = {
      "": "-",
      "create-service": "创建服务",
      "build-service": "构建服务",
      build: "构建服务",
      upgrade: "滚动升级服务",
      "start-service": "启动服务",
      start: "启动服务",
      "stop-service": "停止服务",
      stop: "停止服务",
      "restart-service": "重启服务",
      restart: "重启服务",
      "vertical-service": "垂直扩展服务",
      vertical: "垂直扩展服务",
      "horizontal-service": "水平扩展服务",
      horizontal: "水平扩展服务",
      "set-language": "设置服务语言",
      "delete-service": "删除服务",
      "upgrade-service": "升级服务",
      "delete-buildversion": "删除构建版本",
      "share-service": "分享服务",
      "add-service-dependency": "添加服务依赖",
      "delete-service-dependency": "删除服务依赖",
      "add-service-env": "添加服务环境变量",
      "update-service-env": "更新服务环境变量",
      "delete-service-env": "删除服务环境变量",
      "add-service-port": "添加服务端口",
      "update-service-port-old": "更新服务端口",
      "update-service-port": "更新服务端口",
      "delete-service-port": "删除服务端口",
      "handle-service-outerport": "修改服务对外端口",
      "handle-service-innerport": "修改服务对内端口",
      "change-service-lbport": "修改服务LB端口",
      "rollback-service": "回滚",
      "add-service-volume": "添加服务持久化存储",
      "update-service-volume": "更新服务持久化存储",
      "delete-service-volume": "删除服务持久化存储",
      "add-service-depvolume": "添加服务依赖存储",
      "delete-service-depvolume": "删除服务依赖存储",
      "add-service-probe": "添加服务探针",
      "update-service-probe": "更新服务探针",
      "delete-service-probe": "删除服务探针",
      "add-service-label": "添加服务标签",
      "update-service-label": "更新服务标签",
      "delete-service-label": "删除服务标签",
      "add-thirdpart-service": "添加第三方服务",
      "update-thirdpart-service": "更新第三方服务",
      "delete-thirdpart-service": "删除第三方服务",
      "update-service-gateway-rule": "更新服务网关规则",
      "app-restore-envs": "重新加载应用环境变量",
      "app-restore-ports": "重新加载应用端口",
      "app-restore-volumes": "重新加载应用存储",
      "app-restore-probe": "重新加载应用探针",
      "app-restore-deps": "重新加载应用依赖",
      "app-restore-depvols": "重新加载应用依赖存储",
      "app-restore-plugins": "重新加载应用插件"
    };
    return statusOptType[state] || state;
  },
  replaceUrlTeam(team) {
    let href = location.href;
    const reg = /team\/([^/]+)/;
    href = href.replace(reg, (string, g1) =>
      string.replace(new RegExp(g1), team)
    );
    return href;
  },
  replaceUrlRegion(region) {
    let href = location.href;
    const reg = /region\/([^/]+)/;
    href = href.replace(reg, (string, g1) =>
      string.replace(new RegExp(g1), region)
    );
    return href;
  },
  replaceUrlTeamAndTegion(team, region) {
    let href = location.href;
    const reg = /team\/([^/]+)\/region\/([^/]+)/;
    href = href.replace(reg, (string, g1, g2) =>
      string.replace(new RegExp(g1), team).replace(new RegExp(g2), region)
    );
    return href;
  }
};

export default global;
