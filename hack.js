const puppeteer = require("puppeteer");
const fs = require('fs');

let search = "JavaScript Code with Harry";
// const width=1024, height=1600;
let dataObj = [];

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ["--start-maximized"],
        defaultViewport: null,
        slowMo: 200,
    });
    let page = await browser.newPage();

    await page.goto(
        "https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL",
        { waitUntil: "load", timeout: 0 }
    );
    await page.setDefaultNavigationTimeout(60000);

    let totalNoOfVideos = await page.evaluate(function () {
        let number = document.querySelector(
            ".style-scope.ytd-playlist-sidebar-primary-info-renderer  yt-formatted-string span",
            { waitUntil: "load", timeout: 0 });
        let s = number.innerText;
        return s;
    });
    console.log(totalNoOfVideos);

    await page.waitForSelector(
        ".style-scope.ytd-playlist-video-renderer a[id='video-title']", { waitUntil: "load", timeout: 0 });
    let videoLinks = await page.evaluate(function () {

        function hmsToSecondsOnly(str) {
            var p = str.split(':'),
                s = 0, m = 1;

            while (p.length > 0) {
                s += m * parseInt(p.pop(), 10);
                m *= 60;
            }

            return s;
        }

        let videoLinks = document.querySelectorAll(
            ".style-scope.ytd-playlist-video-renderer a[id='video-title']", { waitUntil: "load", timeout: 0 });
        let arrOfPlaylistVideos = [];
        for (let i = 0; i < videoLinks.length; i++) {
            arrOfPlaylistVideos.push(
                "https://www.youtube.com/" + videoLinks[i].getAttribute("href")
            );
        }

        let span = document.querySelectorAll(
            "ytd-thumbnail-overlay-time-status-renderer[overlay-style='DEFAULT'] span"
        );
        let allVideosDuration = [];
        for (let i = 0; i < span.length; i++) {
            allVideosDuration.push(hmsToSecondsOnly(span[i].innerText.trim()));
        }

        let videoTitle = document.querySelectorAll("#content #meta .style-scope.ytd-playlist-video-renderer #video-title");
        let videoTitleArr = [];

        for (let i = 0; i < videoTitle.length; i++) {
            let title = videoTitle[i].innerText.split("|");
            videoTitleArr.push(title[0]);
        }

        return { arrOfPlaylistVideos, allVideosDuration, videoTitleArr };
    });
    // console.log(videoLinks.videoTitleArr);
    // console.log(videoLinks.allVideosDuration);
    // console.log(videoLinks.arrOfPlaylistVideos);



    for (let i = 0; i < videoLinks.allVideosDuration.length; i++) {
        // console.log(`Duration of ${i} video is ${videoLinks.allVideosDuration[i]}`);
    }

    let totalDurationInSeconds = videoLinks.allVideosDuration.reduce(function (a, b) { return a + b })
    let totalDurationInHours = (totalDurationInSeconds / 3600).toFixed(2)
    // return totalDurationInHours;
    // console.log(totalDurationInHours);
    let totalLikes = 0;
    for (let i = 0; i < videoLinks.arrOfPlaylistVideos.length; i++) {
        let data = await getItemTypesData(videoLinks.arrOfPlaylistVideos[i]);
        // console.log(data);
        // console.log(data);
        let likes = data.split(" ");
        let likesVal = likes[0].replace(",", "");
        totalLikes += parseInt(likesVal);

        let details = {
            name: videoLinks.videoTitleArr[i],
            link: videoLinks.arrOfPlaylistVideos[i],
            likes: data,
            duration: `${videoLinks.allVideosDuration[i]} sec`,
        }
        dataObj.push(details);
    }
    // console.log(totalLikes);

    function getItemTypesData(link) {
        return new Promise(function (resolve, reject) {
            page.goto(link).then(async function () {

                // let totalLikes = 0;
                await page.waitForSelector(".style-scope.ytd-video-primary-info-renderer div.style-scope.ytd-video-primary-info-renderer div#top-level-buttons-computed ytd-toggle-button-renderer a yt-formatted-string", { visible: true });

                let videoLikes = page.evaluate(function () {

                    let likesInAVideo = document.querySelector(".style-scope.ytd-video-primary-info-renderer div.style-scope.ytd-video-primary-info-renderer div#top-level-buttons-computed ytd-toggle-button-renderer a yt-formatted-string");

                    let myLikes = likesInAVideo.getAttribute("aria-label");


                    // myLikes.split(" ");
                    return myLikes;
                })
                resolve(videoLikes);
            });
        });
    }

    fs.writeFileSync("youtube.json", dataObj);
})();