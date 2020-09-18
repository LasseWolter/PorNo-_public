// PorNo!
// @author Vivek Bhookya
//  with help from https://www.w3schools.com/howto/howto_js_todolist.asp
// This file is responsible for the addition and deletion of links to the list
//  of website redirect links
//  as well as realtime updates for the collection of porn urls in the cloud
//  and the local machine to use
// ASCII art font is "Doh" from: http://patorjk.com/software/taag/#p=display&v=0&f=Doh&t=FUNCTIONS


// TODO:
// CURRENTLY::

// POPUP

// OTHER
// o onInstalled, open intro youtube video and how to use page

// WRAP UP
// o Refactor me pleaseeeee (hash maps???)
// o ???
// –––
// √ Finish this checklist
// √ When I click on a list item, I should go to a new website
// √ When I click the website, I should go to the website url that is in the name
// √ Opening links shouldn't hijack me out of my current window
// √ Enable random selection from list of links to open when visiting a porn site
// √ The data should persist
// √ I should be able to delete urls
// √ Rotate the text in the url input to display ideas and inspiration for users
// √ I must screen the input links so that the user experience will be seamless and great
// √ What happens when a person inputs a banned link into the redirect url list???
// √ Instruct users to enable the extension in incognito upon download
// √ Allow users to add local files as well
// √ Open a survey when extension is deleted
// √ I should be able to add urls with custom names (titles seperate from the links)
// √ use keyword analysis to determine if a website is adult upon visit so that i
//    can finally stop having to look at porn sites
// √ Enable realtime updates of banned urls through Firebase
// √ The links should be written to a personal database (Firebase DB) for me to screen
// √ Test sync persistence between updates and diff machines https://developer.chrome.com/apps/storage
// √ Add an "emergency button" where ALL LINKS and QUALITY EDUCATION are opened
// √ Screen all inputted redirect urls with the realtime urls
//   If any are of illegal domains, delete them
// √ Explain what data I do and don't collect
// √ How to ensure people open the popup long enough for firebase to work....?
// √ There must be a "how to use" section in the popup and another "about PorNo!" site -- implement
// √ Add links to quality education
// √ Add a place to contact me about links that bypass the filter and other issues in the popup
// √ Add link to  a quiz in the popup
// √ Publish
// √ marquee and promo photos
// √ Make a how-to youtube video / trailer

// Open welcome and how to use pages on initial download
chrome.storage.local.get("notFirstTime", function(returnValue) {
    if (returnValue.notFirstTime === undefined) {
      openLink('user_manual/welcome.html');
      openLink('user_manual/help.html'); // Replace with youtube video
      chrome.storage.local.set({"notFirstTime": true}, function() {} );
    }
});

//  with help from https://stackoverflow.com/questions/13591983/onclick-within-chrome-extension-not-working
$(document).ready(function () {
  // initialize() fills the popup with the links saved in storage
  // setIncognito() informs users to enable the extension in incognito
  // updateDB(); // is undefined - can it be deleted?
  setIncognito();
  initialize();

  // Popup-internal behavior for the add button and the incognito tip message
  $("#submit").click(submit);
  $("#setIncognito").click(helpIncognito);
  $("#emergency").click(emergency);
});

// Allow enter key press to add links
$(document).on("keyup", function() {
    if (event.keyCode === 13) {
      submit();
    }
});

// Gets the title attribute (the url) of the clicked li and sends that to openLink, which opens the url
// Thank you https://stackoverflow.com/questions/34964039/dynamically-created-li-click-event-not-working-jquery
$(document).on("click", "li", function() {
    openLink(this.id);
});

// Deletes the selected list item and removes it from storage
$(document).on("click", "span", function(event) {
  let keyValueToRemove = this.parentElement.id;

  // Remove key-value from storage
  // Try-catch cause when the limits are exceeded, we receive an error message. We handle that
  //  in the catch block
  try {
    chrome.storage.sync.remove([keyValueToRemove], function() {});
  } catch (e) {
    document.getElementById("ERROR_MSG").innerHTML="Too many operations...please try again later, sorry!";
  }

  // Only update list when we confirm that the desired deletion has succeeded
  if (chrome.storage.sync.get([keyValueToRemove], function() {}) === undefined) {
    this.parentElement.remove();
  }

  // Prevents the li.click from firing -- this resulted in opening a new tab of
  //  the deleted link
  event.stopPropagation();
});

// Display little text when hovering over the links
$(document).on('mouseover', 'li', function () {
  $(this).attr('title', 'Click to visit ' + this.id);
});

$(document).on('mouseover', 'span', function () {
  $(this).attr('title', 'Delete link?');
});

$(document).on('mouseover', '#emergency', function () {
  $(this).attr('title', "It's time to PorNo!");
});

// Function initialize()
// Initializes the websites list with the links saved in storage
// Using Google.sync.storage allows the links to persist through devices as the
//  data is saved to the Google account currently signed in
function initialize() {
  // Array that stores all the keys (urls)
  let urls;

  // Get all keys currently in storage
  chrome.storage.sync.get(null, function(items) {
    urls = Object.keys(items);
    // console.log('Our keys: ' + urls);

    // If urls[0] is undefined (aka nothing exists in storage), skip
    //  initialization of the list
    if (urls[0] !== undefined) {
        // Iterate through the urls array
        //  and collect the names associated and add them to the list,
        //  one at a time with initList()
        // 4/27/18 - I encountered asynchronous programming
        for (let i = 0; urls[i] !== undefined; i++) {
          initList(urls[i]);
        }
    }

    // If nothing is in storage, show this prompt
    else {
      let msg = 'Nothing here yet...add something that inspires you!';
      document.getElementById("ERROR_MSG").innerHTML = msg.fontcolor('DeepPink');
    }
  });
}

// Function initList()
// Creates the li objects with the values passed in from initialize()
// The reason this function exists is to avoid race conditions between the for loop
//  iteration and the value sent into the get(). The loop resolves faster than the
//  get method can return the associated value and create an li, so we were left with
//  several "undefined" list objects
// @param currentKey The key we are retrieving the value of from storage
// tl;dr Something something asynchronous something something race condition
function initList(currentKey) {
  // Retrieve the value associated with the current key
 chrome.storage.sync.get(currentKey, function(returnValue) {
   let url = currentKey;
    // Check if this key-value pair exists
     if (returnValue[url] !== undefined) {
       // Pass in the url of the link and the name of the link
       // isBanned(url, returnValue[url], 'initList');
       if (isBanned(url, returnValue[url], 'initList')) {
         // This key:value pair is removed from storage in isBanned()
       }
       else {
         let name = returnValue[url];
         let li = document.createElement("li");

         let t = document.createTextNode(name);

         li.appendChild(t);
         document.getElementById("websites").appendChild(li);

         // ID the element we just made with its url
         li.id = url;

         let span = document.createElement("SPAN");
         let txt = document.createTextNode("\u00D7");
         span.className = "delete";
         span.appendChild(txt);
         li.appendChild(span);
       }
     }
   });
}

// Function submit()
// Begin the process of creating a new list item when clicking on the "Add" button
function submit() {
  let url = document.getElementById("INPUT_url").value.trim();
  let name = document.getElementById("INPUT_name").value.trim();

  // Boolean flag to avoid modifiying filepath submissions
  let isURL = (!url.includes('file://'));

  // URL checks
  if (isURL) {
    // Input blank, do nothing
    if (url === '') {
      // Set error message to blank
      document.getElementById("ERROR_MSG").innerHTML="";

      return;
    }

    // Any spaces, display error
    else if (url.includes(' ')) {
      document.getElementById("ERROR_MSG").innerHTML="Invalid format, sorry. Do not include spaces in the link.";
      return;
    }
  }

  isBanned(url, name, 'submit');

}

// Function isBanned
// Extract the domain name from the inputted url and check if the input's
//  domain name is a porn site domain
// Ya boi Vivek out here writing a porn filter ayy lmao
// @param url The url whose domain name we check against the porn sites
// @param name The name of the url
// @param origin The name of the function that called isBanned
function isBanned(url, name, origin) {
  chrome.storage.local.get("realtimeBannedLinks", function(retValue) {
    let storedLinks = retValue.realtimeBannedLinks;
    let bannedLinks = [
      '.xxx','.adult','.porn','anissa-kate','anissakate','manyvids',
      '.sex','jizzman.com','tube8','barelist.com',
      '.porno','vid27.com','.sx', 'porno.', 'xnxx.com', 'hugesex.tv',
      '.sexy','swallowed.com', 'newsexxxx.com','.sucks','.wang','puba.com',
      'evanotty.com','xfreehd.com', '.webcam','.exposed', 'pornhub.com',
      'foxporn.com','realgfporn.com','34jpornstar.us','sex3.com','sexu.com',
      'titsbox.com','tryboobs.com','tubedupe.com','tubeon.mobi','porn4days',
      'tubepornclassic.com','pornav.net','tubous.com','nevid.us','viptube.com',
      'vivatube.com','vivud.com','voyeurhit.com','vporn.com','wetplace.com',
      'winporn.com','xcafe.com','funnyjunk.com/nsfw','xozilla.com','xxxdan.com',
      'yeptube.com','yourlust.com','ah-me.com','analdin.com',
      'dirtypornivds.com','zemporn.com','stocking-tease.com',
      'pornvideohunter.com','zmovs.com','fuck55.net','3gpkings.com','kompoz.me',
      'realitykings.com','pornolaba.com','foxporns.com','anyporn.com',
      'videosexarchive.com','redwap.me','avelip.com','anysex.com','megacam.me',
      'longsextubes.com','bustymomsvideo.com','clipeu.com','brazzers.com',
      'bangbus.com','assparade.com','tuboff.com','erome.com',
      'monstersofcock.com','porno-wonder.com','siska.tv','gofucker.com',
      'pornalized.com','pornoid.com','pornoxo.com','pornpy.com',
      'pornsharing.com','pornwatchers.com','pornxs.com','bigmouthfuls.com',
      'bigtitsroundasses.com','chaturbate.com','tugjobs.com','flyingjizz.com',
      'jizzbunker.com','fap18.net','euphoriaporn.com','japan-whores.com',
      'pinkrod.com','uploporn.com','hdzog.com','iceporn.com','hotmovs.com',
      'hellporno.com','bigtitcreampie.com','camvideos.com','txxx.com',
      'eskimotube.com','beeg.com','milfsoup.com','flyflv.com',
      'brownbunnies.com','mrporngeek.porn','upornia.com','bangbrostubehd.com',
      'adultdvdempire.com','bangbrosclips.com','faapy.com','porndish.com',
      'magicalfeet.com','topchats.com','adultreviews.com','18tokyo.com',
      '1virgins.com','1girl1camera.com','pridestudios.com','1by-day.com',
      '1800dialadick.com','1passforallsites.com','freeones.com',
      'dreammovies.com','pornhubfillesalope.com','girlygifporn.com',
      'arabicdancevideo.blogspot.com','kellydivine.co','tubepornstars.com',
      'tubepornstars.com','vintagehairy.net','lookatvintage.com','pornorama.com',
      'ass4all.com','cindymovies.com', 'onlygirlvideos.com', 'rofipot.com',
      'spankwire.com', 'arabesexy.com', 'megamovie.us', 'nakedboobs.net',
      'teencamvids.org', 'nudeboobshotpics.com', 'sugarbbw.com',
      'sexbotbonnasse.com', 'salope.1japonsex.com', 'nudematurewomenphotos.com',
      'eroticbeauties.net', 'milfs30.com', 'freshmatureporn.com', 'matureshine.com',
      'wetmaturewhores.com', 'mature-galleries.org', 'owsmut.com', 'webcam.com',
      'maturelle.com', 'toppornsites.com', 'womenmaturepics.com',
      'all-free-nudes-old-granny-mature-women-xxx.com', 'maturepornhub.com',
      'nudeold.com', 'uniquesexymoms.com', 'nude.oldies.com', 'riomature.com',
      'hot-naked-milfs.com', 'stifiersmoms.com', 'multimature.com',
      'oldhotmoms.com', 'matureoracle.com', 'hungrymatures.com', 'milfous.com',
      'watersweb.com', 'eromatures.net', 'mom50.com', 'maturesinstockings.com',
      'imaturewomen.com', 'wetmaturewomen.com', 'matureandyoung.com',
      'momshere.com', 'riomoms.com', 'kissmaturesgo.com', 'bitefalm.com',
      'milfionaire.com', 'sexymaturethumbs.com', 'maturosexy.com', '6mature9.com',
      'hotnakedoldies.com', 'reddit.com/r/NSFW411', 'reddit.com/r/nsfw',
      'reddit.com/r/suicidegirls', 'reddit.com/r/nsfw2',
      'reddit.com/r/TipOfMyPenis', 'reddit.com/r/bonermaterial',
      'reddit.com/r/porn', 'reddit.com/r/nsfw411', 'reddit.com/r/iWantToFuckHer',
      'reddit.com/r/exxxtras', 'reddit.com/r/distension',
      'reddit.com/r/bimbofetish', 'reddit.com/r/christiangirls',
      'reddit.com/r/cuckold', 'reddit.com/r/dirtygaming',
      'reddit.com/r/sexybutnotporn', 'reddit.com/r/femalepov',
      'reddit.com/r/omgbeckylookathiscock', 'reddit.com/r/milf',
      'reddit.com/r/gonewild30plus', 'reddit.com/r/ohnomomwentwild',
      'reddit.com/r/preggoporn', 'reddit.com/r/legalteens',
      'reddit.com/r/collegesluts', 'reddit.com/r/adorableporn',
      'reddit.com/r/legalteensXXX', 'reddit.com/r/gonewild18', 'reddit.com/r/18_19',
      'reddit.com/r/just18', 'reddit.com/r/realgirls', 'reddit.com/r/amateur',
      'reddit.com/r/homemadexxx', 'reddit.com/r/AmateurArchives',
      'reddit.com/r/dirtypenpals', 'reddit.com/r/FestivalSluts',
      'reddit.com/r/CollegeAmateurs', 'reddit.com/r/amateurcumsluts',
      'reddit.com/r/nsfw_amateurs', 'reddit.com/r/funwithfriends',
      'reddit.com/r/randomsexiness', 'reddit.com/r/amateurporn',
      'reddit.com/r/normalnudes', 'reddit.com/r/Camwhores', 'reddit.com/r/camsluts',
      'reddit.com/r/SluttyStrangers', 'reddit.com/r/GoneWild',
      'reddit.com/r/PetiteGoneWild', 'reddit.com/r/gonewildstories',
      'reddit.com/r/GoneWildTube', 'reddit.com/r/treesgonewild',
      'reddit.com/r/gonewildaudio', 'reddit.com/r/GWNerdy', 'reddit.com/r/gonemild',
      'reddit.com/r/altgonewild', 'reddit.com/r/gifsgonewild',
      'reddit.com/r/analgw', 'reddit.com/r/gonewildsmiles',
      'reddit.com/r/onstageGW', 'reddit.com/r/RepressedGoneWild',
      'reddit.com/r/bdsmgw', 'reddit.com/r/UnderwearGW', 'reddit.com/r/LabiaGW',
      'reddit.com/r/TributeMe', 'reddit.com/r/WeddingsGoneWild',
      'reddit.com/r/gwpublic', 'reddit.com/r/assholegonewild',
      'reddit.com/r/leggingsgonewild', 'reddit.com/r/dykesgonewild',
      'reddit.com/r/gonewild30plus', 'reddit.com/r/gonewild18',
      'reddit.com/r/ohnomomwentwild', 'reddit.com/r/GWCouples',
      'reddit.com/r/gonewildcouples', 'reddit.com/r/gwcumsluts',
      'reddit.com/r/WouldYouFuckMyWife', 'reddit.com/r/gonewildcurvy',
      'reddit.com/r/GoneWildplus', 'reddit.com/r/BigBoobsGW',
      'reddit.com/r/bigboobsgonewild', 'reddit.com/r/AsiansGoneWild',
      'reddit.com/r/gonewildcolor', 'reddit.com/r/indiansgonewild',
      'reddit.com/r/workgonewild', 'reddit.com/r/GoneWildScrubs',
      'reddit.com/r/NSFW_Snapchat', 'reddit.com/r/snapchat_sluts',
      'reddit.com/r/snapleaks', 'reddit.com/r/wifesharing', 'reddit.com/r/hotwife',
      'reddit.com/r/rule34', 'reddit.com/r/hentai', 'reddit.com/r/ecchi',
      'reddit.com/r/futanari', 'reddit.com/r/hentai_gif', 'reddit.com/r/doujinshi',
      'reddit.com/r/overwatch_porn', 'reddit.com/r/rule34_comics',
      'reddit.com/r/sex_comics', 'reddit.com/r/BDSM', 'reddit.com/r/Bondage',
      'reddit.com/r/BDSMcommunity', 'reddit.com/r/bdsmgw', 'reddit.com/r/blowjobs',
      'reddit.com/r/lipsthatgrip', 'reddit.com/r/deepthroat',
      'reddit.com/r/onherknees', 'reddit.com/r/blowjobsandwich', 'reddit.com/r/ass',
      'reddit.com/r/asstastic', 'reddit.com/r/facedownassup',
      'reddit.com/r/assinthong', 'reddit.com/r/bigasses', 'reddit.com/r/buttplug',
      'reddit.com/r/TheUnderbun', 'reddit.com/r/booty', 'reddit.com/r/anal',
      'reddit.com/r/analgw', 'reddit.com/r/painal', 'reddit.com/r/masterofanal',
      'reddit.com/r/buttsharpies', 'reddit.com/r/asshole',
      'reddit.com/r/AssholeBehindThong', 'reddit.com/r/assholegonewild',
      'reddit.com/r/girlsinyogapants', 'reddit.com/r/yogapants',
      'reddit.com/r/boobies', 'reddit.com/r/tinytits', 'reddit.com/r/TittyDrop',
      'reddit.com/r/burstingout', 'reddit.com/r/boltedontits',
      'reddit.com/r/boobbounce', 'reddit.com/r/boobs', 'reddit.com/r/downblouse',
      'reddit.com/r/homegrowntits', 'reddit.com/r/cleavage',
      'reddit.com/r/breastenvy', 'reddit.com/r/youtubetitties',
      'reddit.com/r/torpedotits', 'reddit.com/r/thehangingboobs',
      'reddit.com/r/BustyPetite', 'reddit.com/r/hugeboobs', 'reddit.com/r/stacked',
      'reddit.com/r/BigBoobsGW', 'reddit.com/r/bigboobsgonewild',
      'reddit.com/r/pokies', 'reddit.com/r/ghostnipples', 'reddit.com/r/nipples',
      'reddit.com/r/GirlswithNeonHair', 'reddit.com/r/shorthairchicks',
      'reddit.com/r/blonde', 'reddit.com/r/datgap', 'reddit.com/r/girlsinyogapants',
      'reddit.com/r/stockings', 'reddit.com/r/legs', 'reddit.com/r/thighhighs',
      'reddit.com/r/tightshorts', 'reddit.com/r/pussy', 'reddit.com/r/rearpussy',
      'reddit.com/r/innie', 'reddit.com/r/simps', 'reddit.com/r/pelfie',
      'reddit.com/r/LabiaGW', 'reddit.com/r/moundofvenus',
      'reddit.com/r/Hotchickswithtattoos', 'reddit.com/r/sexyfrex',
      'reddit.com/r/tanlines', 'reddit.com/r/oilporn', 'reddit.com/r/SexyTummies',
      'reddit.com/r/theratio', 'reddit.com/r/fitgirls',
      'reddit.com/r/bodyperfection', 'reddit.com/r/gonewildcurvy',
      'reddit.com/r/curvy', 'reddit.com/r/gonewildplus', 'reddit.com/r/thick',
      'reddit.com/r/juicyasians', 'reddit.com/r/voluptuous',
      'reddit.com/r/biggerthanyouthought', 'reddit.com/r/jigglefuck',
      'reddit.com/r/chubby', 'reddit.com/r/BustyPetite', 'reddit.com/r/dirtysmall',
      'reddit.com/r/petitegonewild', 'reddit.com/r/xsmallgirls',
      'reddit.com/r/funsized', 'reddit.com/r/hugedicktinychick',
      'reddit.com/r/volleyballgirls', 'reddit.com/r/Ohlympics',
      'reddit.com/r/celebnsfw', 'reddit.com/r/WatchItForThePlot',
      'reddit.com/r/nsfwcelebarchive', 'reddit.com/r/celebritypussy',
      'reddit.com/r/oldschoolcoolNSFW', 'reddit.com/r/cumsluts',
      'reddit.com/r/GirlsFinishingTheJob', 'reddit.com/r/cumfetish',
      'reddit.com/r/amateurcumsluts', 'reddit.com/r/cumcoveredfucking',
      'reddit.com/r/cumhaters', 'reddit.com/r/thickloads',
      'reddit.com/r/before_after_cumsluts', 'reddit.com/r/creampies',
      'reddit.com/r/throatpies', 'reddit.com/r/FacialFun',
      'reddit.com/r/cumonclothes', 'reddit.com/r/HappyEmbarrassedGirls',
      'reddit.com/r/unashamed', 'reddit.com/r/borednignored',
      'reddit.com/r/latinas', 'reddit.com/r/AsianHotties',
      'reddit.com/r/AsiansGoneWild', 'reddit.com/r/realasians',
      'reddit.com/r/juicyasians', 'reddit.com/r/AsianNSFW',
      'reddit.com/r/nextdoorasians', 'reddit.com/r/asianporn',
      'reddit.com/r/bustyasians', 'reddit.com/r/IndianBabes',
      'reddit.com/r/indiansgonewild', 'reddit.com/r/NSFW_Japan',
      'reddit.com/r/javdownloadcenter', 'reddit.com/r/kpopfap',
      'reddit.com/r/NSFW_Korea', 'reddit.com/r/WomenOfColor',
      'reddit.com/r/darkangels', 'reddit.com/r/blackchickswhitedicks',
      'reddit.com/r/ebony', 'reddit.com/r/ginger', 'reddit.com/r/redheads',
      'reddit.com/r/palegirls', 'reddit.com/r/pawg', 'reddit.com/r/NSFW_GIF',
      'reddit.com/r/nsfw_gifs', 'reddit.com/r/porn_gifs',
      'reddit.com/r/porninfifteenseconds', 'reddit.com/r/CuteModeSlutMode',
      'reddit.com/r/60fpsporn', 'reddit.com/r/NSFW_HTML5', 'reddit.com/r/twingirls',
      'reddit.com/r/groupofnudegirls', 'reddit.com/r/nsfwhardcore',
      'reddit.com/r/SheLikesItRough', 'reddit.com/r/strugglefucking',
      'reddit.com/r/hugedicktinychick', 'reddit.com/r/jigglefuck',
      'reddit.com/r/freeuse', 'reddit.com/r/whenitgoesin',
      'reddit.com/r/outercourse', 'reddit.com/r/gangbang', 'reddit.com/r/breeding',
      'reddit.com/r/pegging', 'reddit.com/r/insertions', 'reddit.com/r/passionx',
      'reddit.com/r/facesitting', 'reddit.com/r/nsfw_plowcam',
      'reddit.com/r/pronebone', 'reddit.com/r/fuxtaposition',
      'reddit.com/r/60fpsporn', 'reddit.com/r/highresNSFW',
      'reddit.com/r/NSFW_HTML5', 'reddit.com/r/incestporn', 'reddit.com/r/wincest',
      'reddit.com/r/sarah_xxx', 'reddit.com/r/remylacroix',
      'reddit.com/r/Anjelica_Ebbi', 'reddit.com/r/lesbians',
      'reddit.com/r/StraightGirlsPlaying', 'reddit.com/r/girlskissing',
      'reddit.com/r/mmgirls', 'reddit.com/r/dykesgonewild',
      'reddit.com/r/holdthemoan', 'reddit.com/r/O_faces', 'reddit.com/r/jilling',
      'reddit.com/r/gettingherselfoff', 'reddit.com/r/quiver',
      'reddit.com/r/suctiondildos', 'reddit.com/r/GirlsHumpingThings',
      'reddit.com/r/forcedorgasms', 'reddit.com/r/mmgirls',
      'reddit.com/r/ruinedorgasms', 'reddit.com/r/grool', 'reddit.com/r/squirting',
      'reddit.com/r/ladybonersgw', 'reddit.com/r/massivecock',
      'reddit.com/r/chickflixxx', 'reddit.com/r/gaybrosgonewild',
      'reddit.com/r/OnOff', 'reddit.com/r/nsfwoutfits',
      'reddit.com/r/Bottomless_Vixens', 'reddit.com/r/girlswithglasses',
      'reddit.com/r/lingerie', 'reddit.com/r/candidfashionpolice',
      'reddit.com/r/bikinis', 'reddit.com/r/collared', 'reddit.com/r/tightshorts',
      'reddit.com/r/seethru', 'reddit.com/r/sweatermeat', 'reddit.com/r/cfnm',
      'reddit.com/r/nsfwcosplay', 'reddit.com/r/nsfwcostumes',
      'reddit.com/r/girlsinschooluniforms', 'reddit.com/r/WtSSTaDaMiT',
      'reddit.com/r/tightdresses', 'reddit.com/r/upskirt', 'reddit.com/r/stockings',
      'reddit.com/r/thighhighs', 'reddit.com/r/leggingsgonewild',
      'reddit.com/r/assinthong', 'reddit.com/r/AssholeBehindThong',
      'reddit.com/r/girlsinyogapants', 'reddit.com/r/yogapants',
      'reddit.com/r/ChangingRooms', 'reddit.com/r/workgonewild',
      'reddit.com/r/trashyboners', 'reddit.com/r/FlashingGirls',
      'reddit.com/r/publicflashing', 'reddit.com/r/sexinfrontofothers',
      'reddit.com/r/NotSafeForNature', 'reddit.com/r/gwpublic',
      'reddit.com/r/realpublicnudity', 'reddit.com/r/socialmediasluts',
      'reddit.com/r/Tgirls', 'reddit.com/r/traps', 'reddit.com/r/futanari',
      'reddit.com/r/pornvids', 'reddit.com/r/nsfw_videos',
      'reddit.com/r/dirtysnapchat', 'reddit.com/r/randomactsofblowjob',
      'reddit.com/r/NSFWFunny', 'reddit.com/r/confusedboners',
      'reddit.com/r/dirtykikpals', 'reddit.com/r/nsfw_wtf',
      'reddit.com/r/randomactsofmuffdive', 'reddit.com/r/gore',
      'reddit.com/r/watchpeopledie', 'reddit.com/r/popping', 'golden-moms.com',
      'madmamas.com', 'womanolder.com', 'matureland.net', 'motherstits.com',
      'unshavenpussies.net', 'pornmaturepics.com', '105matures.com',
      'momstaboo.com', 'broslingerie.com', 'elderly-women.com', 'upskirttop.net',
      'bushypussies.net', 'amateurmaturewives.com', 'universeold.com',
      'unshavengirls.com', 'oldernastybitches.com', 'maturewant.com',
      'juliepost.com', 'mulligansmilfs.com', 'bestmaturewomen.com', 'riomature.com',
      'mature-orgasm.com', 'inlovewithboobs.com', 'riotits.net',
      'nakedbustytits.com', 'ass-butt.com', 'matureladiespics.com',
      'pornmaturewomen.com', 'nudemomphotos.com', 'secinsurance.com',
      'bigfreemature.com', 'mature-women-tube.net', 'hotnudematures.com',
      'oldsexybabes.net', 'matureasspics.com', 'mature30plus.com',
      'matureamour.com', 'the momsfucking.net', 'boobymilf.com',
      'fantasticwomans.com', 'xxxmatureposts.com', 'alloldpics.com',
      'lenawethold.com', 'mature.nl', 'wifezilla.com', 'chubbygalls.com',
      'nudematurepics.com', 'matureal.com', 'thexmilf.com', 'cocomilfs.com',
      'zmilfs.com', 'wild-matures.com', 'horny-matures.net', 'grandmabesttube.com',
      'grandmabesttube.com', 'bestmilftube.com', 'needmilf.com', 'girlmature.com',
      'bestmatureclips.com', 'lustfuloldies.com', 'riomoms.com', 'maturehotsex.com',
      'bettermilfs.com', 'milfionaire.com', 'oldercherry.com', 'oldercherry.com',
      'sexymilfpussy.com', 'maturepornpics.com', 'action36.com', 'dianapost.com',
      'babesclub.net', 'lovely-mature.net', 'bestmaturesthumb.com',
      'myfreemoms.com', 'milfatwork.net', 'milfgals.net', 'olderwomenarchive.com',
      'milfmomspics.com', 'pornvideoitaly.com', 'stiflersmilfs.com',
      'maturenags.com', 'maturenakedsluts.com', 'tgpmaturewoman.com',
      'idealwifes.com', 'maturewitch.com', 'hqmaturemovs.com',
      'mature-women-tube.org', 'olderwomentaboo.com', 'chocomilf.com',
      'milfparanoia.com', 'momsnightjob.com', 'matureintros.com', 'booloo.com',
      'bigbuttmature.com', 'maturetube.com', 'mature30-45.com', 'pornbox.org',
      'honestpornreviews.com', 'crocreview.com', 'realitypornsearch.com',
      'paypornlist.net', 'rogreviews.com', 'thetongue.net', 'porninspector.com',
      'backroomfacials.com', 'pawg.com', 'nailedhard.com', 'fuckteamfive.com',
      'bangbros18teens.com', 'partyofthree.com', 'latinarampage.com',
      'backroommilf.com', 'canhescore.com', 'mujeresculonas.net', 'xkeezmovies.com',
      'bangpov.com', 'bang.com', 'porndoe.com', 'blowjobninjas.com', 'mrpornx.com',
      'mydirtymaid.net', 'stepmomvideos.com', 'rabbitsreviews.com', 'empflix.com',
      'boobpedia.com', 'dorminvasion.com', 'easyporn.tv', 'rexmag.com', 'fux.com',
      'pornadept.com', 'mylifeinbrazil.com', 'yespornpleae.com', 'ultrahorny.com',
      'momishorny.com', 'bangoncasting.com', 'bangbros-free.com', '720porn.net',
      'funvidporn.com', 'bangpass.com', 'siterip4fun.com', 'bangbros.com',
      'porntube.com', 'youjizz.com', 'redtube.com', 'xvideos.com', 'xhamster.com',
      'xnxx.com', 'youporn.com', 'hclips.com', 'porn.com', 'tnaflix.com',
      'tube8.com', 'hd21.com', 'newhd.xxx', 'spankbang.com', 'drtuber.com',
      'spankwire.com', 'keezmovies.com', 'nuvid.com', 'sunporno.com',
      'bravotube.net', 'bravoteens.com', 'drtuber.com', 'mylust.com',
      'overthumbs.com', 'palmtube.com', 'pornhd.com', 'porn300.com', 'sexvid.xxx',
      'xxxbunker.com', 'mofosex.com', 'xbabe.com', 'updatetube.com', 'befuck.com',
      'bravoerotica.com', 'masseurporn.com', 'hdmovz.com', 'pornrox.com',
      'pornmaki.com', 'pornid.xxx', 'inxporn.com', 'slutload.com', 'proporn.com',
      'fakeporn.tv', 'pornhost.com', 'handjobhub.com', 'vpornvideos.com',
      'myxvids.com', 'dansmovies.com', 'fapdu.com', 'rude.com',
      'topfreepornvideos.com', 'freudbox.com', 'pornheed.com', 'hdporn.net',
      'orgasm.com', 'pornrabbit.com', 'madthumbs.com', 'fux.com', 'eroxia.com',
      'deviantclip.com', 'xxvids.net', 'h2porn.com', 'apetube.com', 'metaporn.com',
      'elephanttube.com', 'long.xxx', 'pornerbros.com', 'iporntv.net', 'pron.tv',
      'pornplanner.com', 'mypornbible.com', 'badjojo.com', 'findtubes.com',
      'lasmejoreswebsporno.com/en', 'pornmd.com', 'nudevista.com',
      'it.bing.com/videos/search?q=por',
      'video.search.yahoo.com/search/video?fr=sfp&fr2=piv-web&p=porn&.bcrumb=ZaF57phvPYQ,138531013',
      'video.search.yahoo.com/search/video?fr=sfp&fr2=piv-web&p=porn&.bcrumb=t2freeITUJs,1526679329&fr2=p%3As%2Cv%3Av&save=0',
      'adultvideofinder.com', 'awejmp.com', 'imlive.com', 'evilangellive.com',
      'awejmp.com', 'joyourself.com', 'xlovecam.com', 'cams.com', 'pornication.com',
      'delhisexchat.com', 'sexier.com', 'secure.vividcams.com', 'privatefeeds.com',
      'streamate.com', 'slutroulette.com', 't.hrtya.com', 'watchmyexgf.net',
      'watchmygf.cc', 'fantasti.cc', 'watchmygf.me', 'iknowthatgirl.com',
      'daredorm.com', 'crazycollegegfs.com', 'analized.com', 'punishtube.com',
      'stufferdb.com', '88gals.com', 'sexforums.com/gallery', 'apina.biz',
      'babe-lounge.com', 'fuskator.com', 'gotporn.com', 'arabianchicks.com',
      'extremetube.com', 'fetishpapa.com', 'fuckler.com', 'fantasti.cc',
      'bdsmstreak.com', 'zzcartoon.com', 'animeidhentai.com', 'hentaihaven.org',
      'simply-hentai.com', 'hentaigasm.com', 'fakku.net', 'gelbooru.com',
      'hentaipulse.com', 'porcore.com', 'hentaischool.com',
      'chan.sankakucomplex.com', 'hentai-foundry.com', 'babesrater.com',
      'punchpin.com', 'lustpin.com', 'sexlikereal.com', 'vrsmash.com', 'stasyq.com',
      'mobilevrxxx.com', 'realitylovers.com', 'myporngay.com', 'zzgays.com',
      'gay-lounge.net', 'justusboys.com', 'iptorrents.com/torrents', 'rarbg.com',
      'pussytorrents.org', 'porn.com', 'yourdailypornstars.com',
      'bestpornstardb.com', 'babepedia.com', 'kindgirls.com', 'playindiansex.com',
      'playindianporn.com', 'viewdesisex.com', 'hotsouthindiansex.com',
      'watchindianporn.net', 'xpaja.net', 'lesbian8.com', 'kirtu.com',
      'velamma.com', 'nutaku.net', '69games.xxx', 'gamcore.com',
      'assist.lifeselector.com', 'playforceone.com', 'brazzersnetwork.com',
      'wct.link', 'rk.com', 'digitalplayground.com', 'mofosnetwork.com',
      'gfrevenge.com', 'twistysnetwork.com', 'teamskeet.com', 'bangbrosnetwork.com',
      'iyalc.com', 'ddfnetwork.com', 'braincash.com', 'iyalc.com', 'videosz.com',
      'hustler.com', 'premiumbukkake.com', 'javhd.com', 'pornprosnetwork.com',
      'perfectgonzo.com', 'alljapanesepass.com', 'momsbangteens.com',
      'wickedpictures.com', 'puffynetwork.com', '18videoz.com', 'nubiles.net',
      'kinkyfamily.com', 'allofgfs.com', 'filf.com', 'dorcelclub.com',
      'best-paypornsites.com', 'nakednews.com', 'playboy.com', 'forumophilia.com',
      'jdforum.net', 'freeones.com', 'peachyforum.com', 'sexyrealsexdolls.com',
      'spklmis.com', 'toppornsites.com', 'Tubegalore.com', 'gaymaletube.com',
      'iXXX.com', '1piecehentai.com', '2hentai.com', '2th.com', '4chan.com',
      '69ani.com', '8muses.com', 'aerisdies.com', 'allhentai.com',
      'animefootfetish.com', 'animehentaimangas.com', 'animetor.com',
      'animephile.com', 'aryion.com', 'asmhentai.com', 'atsuifeet.com', 'baidu.com',
      'baixarhentai.com', 'bamtoki.com', 'bangcartoons.com', 'baramangaonline.com',
      'bbotoon.com', 'bobx.com', 'brasilhentai.com', 'clickhentai.com',
      'codegeassxxx.com', 'colorhentaimangas.com', 'comicsfromhell.com',
      'comicsporno.com', 'comicspornogratis.com', 'comixhere.com',
      'deliciousdoujinshi.com', 'dochentai.com', 'doujin2.com', 'doujin-th.com',
      'doujindaily.com', 'doujinland.com', 'doujinlife.com',
      'doujinloverandgiver.com', 'doujinmode.com', 'doujinpage.com',
      'doujinreader.com', 'doujinroom.com', 'doujins.com', 'doujinshentai.com',
      'doujinshi rocks.com', 'doujinshihentai.com', 'doujinx.com', 'e-hentai.com',
      'ecchitail.com', 'ero-senin.com', 'erolord.com', 'eromanga-sokuhou.com',
      'eshentaionline.com.com', 'exhentai.com', 'fapdu.com', 'ff10hentai.com',
      'ff12hentai.com', 'ff7hentai.com', 'finalxxxfantasy.com', 'furaffinity.com',
      'futahentai.com', 'futanarispash.com', 'g6hentai.com', 'gs-uploader.com',
      'gurrenhentai.com', 'h-manga moe.com', 'hakihome.com', 'hbrowse.com',
      'hcomicbook.com', 'hdarkzone.com', 'hellven.com', 'hentai-ddl.com',
      'hentai-free.com', 'hentai-id.com', 'hentai-ita.com', 'hentai-manga.com',
      'hentaicafe.com', 'hentaims.com', 'hentaipink.com', 'hentaltl.com',
      'hental2read.com', 'hentai4me.com', 'hentai4doujin.com', 'hentai4manga.com',
      'hentai4u.com', 'hentai666.com', 'hentaibeast.com', 'hentaiboxfr.com',
      'hentaibox.com', 'hentaibunny.com', 'hentaibusty.com', 'hentaichan.com',
      'hentaicloud.com', 'hentaicorner.com', 'hentaifamed.com', 'hentaifield.com',
      'hentaifox.com', 'hentaifr.com', 'hentaifromhell.com', 'hentaigamech.com',
      'hentaigratuit.com', 'hentaihere.com', 'hentaihouse.com', 'hentaihousext.com',
      'hentaihunt.com', 'hentaiiXXX.com', 'hentaijuggs.com', 'hentailx.com',
      'hentailxers.com', 'hentaimangabiz.com', 'hentaimangaonline.com',
      'hentaimangaz.com', 'hentainesia.com', 'hentaiporns.com', 'hentairead.com',
      'henairing.com', 'hentairules.com', 'hentaischool.com', 'hentaisd.com',
      'hentaistack.com', 'hentaivn.com', 'hentype.com', 'hgamecg.com', 'hhhhhh.com',
      'high-hentai.com', 'hime-doujins.com', 'hipercool.com', 'hitomi.com',
      'hmangasearcher.com', 'hotdhentai.com', 'ihentaimanga.com', 'imagefap.com',
      'incesthentai.com', 'junkuchan.com', 'kimi-h.com', 'komikhentai.com',
      'lolhentai.com', 'lookmanga.com', 'lovehentaimanga.com', 'luscious.com',
      'ohentai.com', 'mahenku.com', 'manga12.com', 'mangaboxes.com', 'mangafap.com',
      'mangakawaiifeet.com', 'manganude.com', 'mangaray.com', 'mangaseries.com',
      'mangawindow.com', 'mapussy.com', 'massivehentai.com', 'maturemangas.com',
      'megahentaicomics.com', 'milkyhentai.com', 'minihentai.com',
      'muchodoujins.com', 'muchohentai.com', 'multporn.com', 'mydoujins.com',
      'myhentaicomics.com', 'myreadingmanga.com', 'narutohentaigalleries.com',
      'nhentai.com', 'nude-moon.com', 'nxt-comics.com', 'ohtori.com',
      'omorashi.com', 'overwatchhentaidb.com', 'palcomix.com', 'pbxwwoec.com',
      'personahentai.com', 'perveden.com', 'pinayacenter.com', 'plentyofhentai.com',
      'pomfpomf.com', 'porncomics.com', 'porncmix.com', 'pornocomics.com',
      'pornsource.com', 'pornxxxcomics.com', 'primehentai.com', 'proxer.com',
      'pururin.com', 'r34comics.com', 'readhentaidoujinshi.com',
      'readhentaimanga.com', 'readincesthentai.com', 'readmangahentai.com',
      'revistasequadrinhos.com', 'ryuutama.com', 'sextgem.com', 'shentai.com',
      'simply-hentai.com', 'sinnergate.com', 'smdc-translations.com',
      'sohentai.com', 'submanga.com', 'sukahentai.com', 'svscomics.com',
      'sweetyaoiparadise.com', 'thedoujin.com', 'thehentaiworld.com',
      'tmohentai.com', 'truyen18.com', 'tsumino.com', 'underworld-scans.com',
      'fapworks.com', 'vanillahentai.com', 'ver-manga.com', 'vercomicsporno.com',
      'vesquare.com', 'watchhentaistream.com', 'world-hentai.com', 'xcartx.com',
      'xcomics4you.com', 'xxcomics.com', 'xxxyuna.com', 'yaoichan.com',
      'yaoifox.com', 'yaoihavenreborn.com', 'yuri-ism.com', 'yurimanga.com',
      'zizki.com', 'zkomik.com', 'findtubes.com', '1indiansex.net', '3rat.com',
      '4hen.com', 'africansexvideos.net', 'bananabunny.com', 'cutepornvideos.com',
      'desimurga.com', 'desisexclips.com', 'dslady.com', 'eroticperfection.com',
      'porn.com', 'porn.org', 'gaypormium.com', 'gracefulnudes.com',
      'hot-dates.info', 'hqlinks.net', 'indiansex4u.com.xxx', 'jav-porn.net',
      'legalporno.com', 'luboeporno.com', 'pinkythekinky.com', 'sexsex.hu',
      'sexxxi.com', 'semale.asia', 'thefreecamsecret.com', 'momsteachsex.com',
      'petardas.com', '89.com', 'alohatube.com', 'babosas.com', 'callboyindia.com',
      'cam4.co', 'cam4.com', 'cam4.in', 'cholotube.com', 'cliphunter.com',
      'culosgratis.com', 'cumlouder.com', 'darering.com', 'flirt4free.com',
      'fuq.com', 'hairy.com', 'labatidora.net', 'leche69.com', 'livejasmin.com',
      'locasporfollar.com', 'lushstories.com', 'mc-nudes.com', 'myfreecams.com',
      'naughty.com', 'penguinvids.com', 'perfectgirls.com', 'perucaseras.com',
      'pinkworld.com', 'playvid.com', 'puritanas.com', 'rk.com',
      'roundandbrown.com', 'truthordarepics.com', 'videosdemadurasx.com',
      'x-ho.com', 'xixx.com', 'xtube.com', 'xvideosnacional.com', 'purebbwtube.com',
      'babes.com', 'fotosmujeres.pibones.com', 'rubber-kingdom.com',
      'savitabhabhi.mobi', 'pinkvisualtgp.com', 'antarvasna.com', 'hot-gifz.com',
      'lechecaliente.com', 'parejasfollando.es', 'flirthookup.com', 'cerdas.com',
      'chaturbate.com', 'ledauphine.com', 'freex.mobi', 'gokabyle.com',
      'bdenjoymore.blogspot.com', 'petardas.com', 'conejox.com', 'voyeurpipi.com',
      'gouines.pornoxxxi.net', 'arabebaise.com', 'ohasiatique.com', 'poringa.net',
      'lisaannlovers11.tumblr.com', 'h33t.to', 'marocainenue.com',
      'gorgeousladies.com', 'fille-nue-video.com', 'teensnow.com',
      'theofficiallouisejenson.co', 'yourather.com', 'bootlust.com',
      'toonztube.com', 'top-chatroulette.com', 'videosfilleschaudes.com',
      'fillechaude.org', 'femmesmuresx.net', 'liberteenage.com', 'coffeetube.com',
      'awesomeellalove.tumblr.com', 'xnxxgifs.com', 'saoulbadjojo.com',
      'beurettehot.net', 'woodstockreborn.tumblr.com',
      'belles-femmes-arabes.blogspot.com', 'xgouines.com', 'couleurlvoirce.com',
      '3animalsextube.com', 'moncloutube.net', 'sexocean.com', 'femdomempire.com',
      'babosas.co', 'giude-asie.com', 'beauxcul.com', 'maghrebinnes.xl.cx',
      'xnxx-free.net', 'xnxx.vc', 'es.bravotube.net', 'rubias19.com',
      'xxl.onxille.com', 'asiataique-femme.com', 'masalopeblack.com',
      'beautiful-nude-tens-exposed.tur', 'cochonnevideosx.com', 'videosanalesx.com',
      'dorceltv.xn.pl', 'salope-marocaine.com', 'jeunette18.com', 'redtuve.com',
      'les-grosses.net', 'yasminramos.com', 'tukif.com', 'adultwork.com',
      'hairy.com', 'tendance-lesbienne.com', 'indiansexstories.net', 'eros.com',
      '7dog.com', 'vivthomas.com', 'teensnowxvideos.com',
      'x-art.com','chaturbate.com','pinkworld.com','pandamovies.com','muyzorras.com','uplust.com',
      'shemales.com','bigboobsalert.com','culx.org','falconstudios.com','nautilix.com','ovideox.com',
      'herbalviagraworld.com','primecurves.com','xbabe.com','webpnudes.com',
      'smutty.com','naughtyamerica.com','faketaxi.com','momjoi.com','dreammovies.com', 'swallowed.com',
      'asspoint.com', 'bobs-tube.com', '4tube.com', 'canalporno.com', 'eporner.com',
      'hdpornt.com', 'kink.com', 'milffox.com', 'mypornstarbook.com', 'xshare.com'];

    // Combine local links with the most up to date links from storage
    for (let i = 0; storedLinks[i] !== undefined; i++) {
      bannedLinks.push(storedLinks[i]);
    }

  // Final test
  if (isBannedURLRaceCondition(url, bannedLinks)) {
    return true;
  }
  // Origin tag exists bcuz initList() can add list items without unnecessarily
  //  calling storage.set calls, whereas submit() needs to create a list item along
  //  with a storage call
  else if (origin === 'submit') {
    addLink(url, name);
  }

  // Link isn't banned ^_^
  return false;
  });
}

// Function isBannedURLRaceCondition()
// Race condition boooooo
// This function does the checking of a link's ban-status. It exists to remove the undesired effects
//  from asynchronous behaviors that were affecting PorNo!'s functionality
// @param url The url to test
// @param bannedLinks The entire list of links, hardcoded and from storage
function isBannedURLRaceCondition(url, bannedLinks) {
  let lowerCase = url.toLowerCase();

  // Compare domain name (well, and the rest of the link) with porn domains
  // O(n) worst case feels bad but wh(O)lesome porn-checker feels good
  for (let i = 0; i < bannedLinks.length; i++) {
    if (lowerCase.includes(bannedLinks[i].toLowerCase())) {
      // GTFOOOO
      document.getElementById("ERROR_MSG").innerHTML="Sorry, that link won't work. Please try another link.";

      // If the link is also saved in storage, remove it
      chrome.storage.sync.remove([url], function() {});
      return true;
    }
  }

  return false;
}

// Function addLink()
// Creates a li item of a non-banned url and saves the url in storage
// @param url The url to save
// @param name The name to assign the url item in the popup
function addLink(url, name) {
  // Set error message to blank
  document.getElementById("ERROR_MSG").innerHTML="";

  // "Declare" a li object
  let li = document.createElement("li");
  let isURL = (!url.includes('file://'));

  // Yay! Input seems to be valid
  // Assert that the url begins with http:// or https:// (necessary for when we want to open new tabs)
  // If not, add the http (helps smoothen user experience)
  if (!(url.includes('http://') || url.includes('https://'))  && isURL) {
    url = 'http://' + url;
  }

  // If name field was left blank, use the url as the text to display
  let t = '';
  if (name === '') {
    t = document.createTextNode(url);
    name = url;
  }
  else {
    t = document.createTextNode(name);
  }
  li.appendChild(t);

  // Add new key-value of the new url to storage
  // Why try-catch?
  // The Google storage documentation (https://developer.chrome.com/extensions/storage#property-sync):
  //  MAX_WRITE_OPERATIONS_PER_MINUTE, 120
  //  MAX_WRITE_OPERATIONS_PER_HOUR, 1800
  // When the limits are exceeded, we receive an error message. We handle that
  //  in the catch block
  try {
    chrome.storage.sync.set({[url]: name}, function() {
      // Add new li object if storage.sync was a success and
      //  give the element the id of the url received as input to enable onClick
      // document.getElementById("websites").appendChild(li);
      // li.id = input;
      li.id = url;
      document.getElementById("websites").appendChild(li);
      if (!isURL) {
        document.getElementById("ERROR_MSG").innerHTML = "Reminder: Local files can't be accessed on other machines, unless you copy the file to that machine.".fontcolor('DeepPink');
      }
    });
  } catch (err) {
    document.getElementById("ERROR_MSG").innerHTML="Error...please try again later, sorry!";
  }

  // Empty the input field
  document.getElementById("INPUT_url").value = "";
  document.getElementById("INPUT_name").value = "";

  let span = document.createElement("SPAN");
  let txt = document.createTextNode("\u00D7");
  span.className = "delete";
  span.appendChild(txt);
  li.appendChild(span);
}

// Function openLink()
// Clicking on a list item should open the url it
//  corresponds to in a new tab within the same window
// The url is gathered from the clicked li object's id
// @param URL The url to open in the new tab
function openLink(URL) {
  chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.create(
        {url: URL}
      );
  });
}

// helper function that open URL in a new window
function openWindow(URL) {
  chrome.windows.getCurrent(null, function(tab) {
    // Maintain incognito status for opened windows
    if (tab.incognito) {
      chrome.windows.create(
        {url: URL, incognito: true}
      );
    }

    else {
      chrome.windows.create(
        {url: URL}
      );
    }
  });

}

// Function setIncognito()
// This function checks whether or not PorNo! is enabled in incognito browsing
// If not, we show the tip message because forcing users will only hurt our intentions
function setIncognito() {
  chrome.extension.isAllowedIncognitoAccess(function(isAllowedAccess) {
    // If we are enabled in incognito, remove the tip
    if (isAllowedAccess) {
      document.getElementById('setIncognito').remove();
    }
  });
}

// Function helpIncognito()
// Should users click on the incognito tip, they are directed to PorNo!'s
//  extension page to help with the process of enabling "Allow in incognito"
function helpIncognito() {
  chrome.tabs.create({
    url: 'chrome://extensions/?id=' + chrome.runtime.id
  })
}

// Function emergency()
// emergency button functionality
// open all redirects in separate windows
// Why so many windows? so many windows to maximize the amount of time user
//  spends looking at the stuff that motivates him/her
// More exposure may lead to more conversion of sexual energy into positive energy
function emergency() {
  chrome.storage.sync.get(null, function(items) {
    urls = Object.keys(items);

    // Add quality education to the opened links
    urls.push('https://fightthenewdrug.org/overview/');
    urls.push('http://virtual-addiction.com/online-pornography-test/');
    urls.push('user_manual/welcome.html');
    // Iterate through the urls array
    //  and mass-open all the links
    for (let i = 0; urls[i] !== undefined; i++) {
      openWindow(urls[i]);
    }
  });
}
