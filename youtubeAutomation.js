//intialising the library puppeteer and fs 
const puppeteer = require("puppeteer");     
const fs = require('fs');
//an array for storing the following data of youtube playlist
let dataObj = [];

// Now making async function 
(async () => {
    const browser = await puppeteer.launch({
        
        headless: false,
        args: ["--start-maximized"],
        defaultViewport: null,
        slowMo: 200,
    });
    //For opening the new page in the browser
    let page = await browser.newPage();
    //Now opening youtube playlist 
    await page.goto(
        "https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL",
        { waitUntil: "load", timeout: 0 }
    );
    await page.setDefaultNavigationTimeout(60000);
        //now finding the total no. videos in the playlist 
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
        //function for converting mins to secs 
        function hmsToSecondsOnly(str) {
            var p = str.split(':'),
                s = 0, m = 1;

            while (p.length > 0) {
                s += m * parseInt(p.pop(), 10);
                m *= 60;
            }

            return s;
        }
        //Finding all the links of videos in the following playlist 
        let videoLinks = document.querySelectorAll(
            ".style-scope.ytd-playlist-video-renderer a[id='video-title']", { waitUntil: "load", timeout: 0 });
        let arrOfPlaylistVideos = [];
        for (let i = 0; i < videoLinks.length; i++) {
            arrOfPlaylistVideos.push(
                "https://www.youtube.com/" + videoLinks[i].getAttribute("href")
            );
        }
        //Finding the durations of all the videos  
        let span = document.querySelectorAll(
            "ytd-thumbnail-overlay-time-status-renderer[overlay-style='DEFAULT'] span"
        );
        //empty array storing all the durations in seconds 
        let allVideosDuration = [];
        for (let i = 0; i < span.length; i++) {
            allVideosDuration.push(hmsToSecondsOnly(span[i].innerText.trim()));
        }
        // Now finding the title of the videos and storing it in videoTitleArr array
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

    //Function for converting all the Duration in seconds

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
        // Making an object for storing the data in this and represent it in JSON file
        let details = {
            name: videoLinks.videoTitleArr[i],
            link: videoLinks.arrOfPlaylistVideos[i],
            likes: data,
            duration: `${videoLinks.allVideosDuration[i]} sec`,
        }
        dataObj.push(details);
    }
    // console.log(totalLikes);
    // this function helps in finding likes in every video in the playlist 
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
    // By using fs function write file sync it will helps in writing all the objects in the dataObj and by the name of Youtube.json
    fs.writeFileSync("youtube.json", dataObj);
})();


