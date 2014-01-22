/// <reference path="jquery-2.0.1.min.js" />
/// <reference path="id3.js" />

var msie = /*@cc_on!@*/0;

var lastSelected, selectedItems;

function deleteSelect() {
    var nowplaying = player.attr("src");
    playlist.find("tr.info:not(.hide)").each(function () {
        var $this = $(this);
        if ($this.data("url") == nowplaying)
            player.attr("src", "");
        knownFiles.splice(knownFiles.indexOf($this.data("filename")), 1);
        $this.remove();
    });
    playlistChanged();
    lastSelected = null;
}

function playlistChanged() {
    if (knownFiles.length == 0) {
        importButton.appendTo(guidePanel);
        guidePanel.show();

        previousButton.addClass("disabled");
        nextButton.addClass("disabled");
        playButton.addClass("disabled");
    }
    else {
        importButton.appendTo($("header"));
        guidePanel.hide();

        previousButton.removeClass("disabled");
        nextButton.removeClass("disabled");
        playButton.removeClass("disabled");
    }
}

var contextmenu = $("#contextmenu").hide();
var menuitems = contextmenu.children();
menuitems.eq(0).click(function () {
    contextmenu.hide();
    playlist.find("tr.info:not(.hide)").first().dblclick();
});
menuitems.eq(1).click(function () {
    contextmenu.hide();
    deleteSelect();
});
menuitems.eq(2).click(function () {
    contextmenu.hide();
    // TODO: Show detail dialog.
});

$(document).click(function (e) {
    if (contextmenu.find(e.target).length == 0)
        contextmenu.hide();
});

var playlist = $("#playlist"), nullTr = $("#nullTr");
$("#main-section").on("dragenter", function (e) {
    var dataTransfer = e.originalEvent.dataTransfer;

    if (selectedItems) {
        e.preventDefault();
        dataTransfer.dropEffect = "move";
        nullTr.css("border-top", "solid 2px gray");
    }
    else if (dataTransfer.types.contains("Files")) {
        e.preventDefault();
        dataTransfer.dropEffect = "copy";
        nullTr.css("border-top", "solid 2px gray");
    }
}).on("dragover", function (e) {
    var dataTransfer = e.originalEvent.dataTransfer;

    if (selectedItems) {
        e.preventDefault();
        dataTransfer.dropEffect = "move";
        nullTr.css("border-top", "solid 2px gray");
    }
    else if (dataTransfer.types.contains("Files")) {
        e.preventDefault();
        dataTransfer.dropEffect = "copy";
        nullTr.css("border-top", "solid 2px gray");
    }
}).on("dragleave", function (e) {
    nullTr.css("border-top", "none");
}).on("drop", function (e) {
    var dataTransfer = e.originalEvent.dataTransfer;

    if (selectedItems) {
        e.preventDefault();
        selectedItems.insertBefore(nullTr);
        selectedItems = null;
        nullTr.css("border-top", "none");
    }
    else if (dataTransfer.types.contains("Files")) {
        e.preventDefault();
        loadFiles(dataTransfer.files, nullTr);
        nullTr.css("border-top", "none");
    }
});

var knownFiles = [];
function loadFiles(files, insertPoint) {
    var i = 0;
    var file, filename;
    var empty = knownFiles.length == 0;
    (function loadSong() {
        if (i < files.length) {
            file = files[i++];
            filename = file.name;
            if (knownFiles.indexOf(filename) == -1 &&
                (filename.indexOf(".mp3") == filename.length - 4 && mp3) ||
                ((filename.indexOf(".ogg") == filename.length - 4 ||
                filename.indexOf(".oga") == filename.length - 4) && ogg)) {
                knownFiles.push(filename);
                if (empty)
                    playlistChanged();
                readID3(file, function (tag) {
                    var title = tag["frames"]["TIT2"] || filename.substr(0, filename.length - 4),
                        album = tag["frames"]["TALB"] || "<Unknown>",
                        artist = tag["frames"]["TPE1"] || "<Unknown>",
                        genre = tag["frames"]["TCON"] || "<Unknown>",
                        duration = tag["frames"]["TLEN"];
                    var item = $("<tr />", { "draggable": "true" }).data({
                        "url": URL.createObjectURL(file),
                        "filename": filename,
                        "title": title,
                        "album": album,
                        "artist": artist,
                        "genre": genre
                    }).click(function (e) {
                        if (e.ctrlKey)
                            item.toggleClass("info");
                        else {
                            $("tr.info").removeClass("info");
                            item.addClass("info");
                        }
                        if (e.shiftKey) {
                            var songItems = playlist.find("tr:not(.hide)");
                            var startIndex = lastSelected ? songItems.index(lastSelected) : 0,
                                endIndex = songItems.index(this);
                            if (startIndex > endIndex) {
                                var temp = startIndex;
                                startIndex = endIndex;
                                endIndex = temp + 1;
                            }
                            else
                                endIndex++;
                            songItems.slice(startIndex, endIndex).addClass("info");
                        }
                        else
                            lastSelected = this;
                    }).dblclick(function () {
                        if (window.Notification)
                            Notification.requestPermission(function (permission) {
                                if (permission == "granted")
                                    new Notification("NowPlaying", {
                                        "body": item.data("artist") + " - " + item.data("title")
                                    }).onshow = function () {
                                        setTimeout(this.close, 2000);
                                    };
                            });
                        player.on("playing", function seek() {
                            this.currentTime = 3;
                            this.currentTime = 0;
                            $(this).off("playing", seek);
                        }).attr("src", item.data("url"))[0].play();
                        $("tr.success").removeClass("success").find("i").removeClass("icon-pause").removeClass("icon-play");
                        item.addClass("success");
                        nowPlaying = item;
                    }).on("contextmenu", function (e) {
                        e.preventDefault();
                        if (!item.hasClass("info"))
                            item.click();
                        var width = contextmenu.width(), height = contextmenu.height();
                        contextmenu.css({
                            "left": Math.max(0, Math.min(e.clientX, innerWidth - width)) + "px",
                            "top": Math.max(0, Math.min(e.clientY, innerHeight - height)) + "px"
                        }).show();
                    }).on("dragstart", function (e) {
                        var dataTransfer = e.originalEvent.dataTransfer;

                        dataTransfer.effectAllowed = "move";
                        dataTransfer.dropEffect = "move";

                        if (!item.hasClass("info"))
                            item.click();

                        selectedItems = playlist.find("tr.info:not(.hide)");

                        var titles = "";
                        selectedItems.each(function () {
                            titles += $(this).data("title") + "\r\n";
                        });
                        if (msie)
                            dataTransfer.setData("Text", titles);
                        else
                            dataTransfer.setData("text/plain", titles);
                    }).on("dragenter", function (e) {
                        var dataTransfer = e.originalEvent.dataTransfer;

                        if (selectedItems) {
                            e.preventDefault();
                            e.stopPropagation();
                            dataTransfer.dropEffect = "move";
                            item.css("border-top", "solid 2px gray");
                        }
                        else if (dataTransfer.types.contains("Files")) {
                            e.preventDefault();
                            e.stopPropagation();
                            dataTransfer.dropEffect = "copy";
                            item.css("border-top", "solid 2px gray");
                        }
                    }).on("dragover", function (e) {
                        var dataTransfer = e.originalEvent.dataTransfer;

                        if (selectedItems) {
                            e.preventDefault();
                            e.stopPropagation();
                            playlist.on("dragleave");
                            dataTransfer.dropEffect = "move";
                            item.css("border-top", "solid 2px gray");
                        }
                        else if (dataTransfer.types.contains("Files")) {
                            e.preventDefault();
                            e.stopPropagation();
                            playlist.on("dragleave");
                            dataTransfer.dropEffect = "copy";
                            item.css("border-top", "solid 2px gray");
                        }
                    }).on("dragleave", function (e) {
                        playlist.on("dragenter", e);
                        item.css("border-top", "none");
                    }).on("drop", function (e) {
                        var dataTransfer = e.originalEvent.dataTransfer;

                        if (selectedItems) {
                            e.preventDefault();
                            e.stopPropagation();
                            selectedItems.insertBefore(this);
                            selectedItems = null;
                            item.css("border-top", "none");
                        }
                        else if (dataTransfer.types.contains("Files")) {
                            e.preventDefault();
                            e.stopPropagation();
                            loadFiles(dataTransfer.files, this);
                            item.css("border-top", "none");
                        }
                    }).append($("<td />").append($("<i />")))
                        .append($("<td />").text(title))
                        .append($("<td />").text(album))
                        .append($("<td />").text(duration))
                        .append($("<td />").text(artist))
                        .append($("<td />").text(genre))
                        .insertBefore(insertPoint);
                    filter.keyup();
                    loadSong();
                });
            }
            else
                loadSong();
        }
    })();
}

var shuffle = false, playing = false, nowPlaying = null;

var player = $("<audio />").on("playing", function () {
    playlist.find("tr.success i")
        .removeClass("icon-stop")
        .removeClass("icon-pause")
        .addClass("icon-play");
    playing = true;
    playButton.addClass("pause");
    progress.enable();
}).on("pause", function () {
    playlist.find("tr.success i").removeClass("icon-play").addClass("icon-pause");
    playing = false;
    playButton.removeClass("pause");
}).on("ended", function () {
    playlist.find("tr.success i").removeClass("icon-play").addClass("icon-stop");
    playing = false;
    playButton.removeClass("pause");
    progress.disable();
    if (loop == 1)
        nowPlaying.dblclick();
    if (loop == 2)
        nextButton.click();
}).on("timeupdate", function () {
    if (!dragging)
        progress.val(player.prop("currentTime") / player.prop("duration"));
}), mp3 = player[0].canPlayType("audio/mpeg") == "maybe",
ogg = player[0].canPlayType("audio/ogg") == "maybe",
fileSelector = $("#file").change(function () {
    loadFiles(this.files, nullTr);
});

function Slider(element) {
    var $this = this;
    this.element = $(element).mousedown(function (e) {
        if (enabled && e.button == 0) {
            $this.val((e.pageX - $this.element.offset().left) / $this.element.width());
            $this.thumb.trigger(e);
        }
    });
    this.background = this.element.find(".slider-background");
    this.foreground = this.element.find(".slider-foreground");
    this.thumb = this.element.find(".slider-thumb").mousedown(function (e) {
        if (enabled && e.button == 0) {
            var startX = e.pageX, startValue = $this.val();
            e.stopPropagation();
            for (var i = 0; i < handlers["dragstart"].length; i++)
                handlers["dragstart"][i].call($this, e);
            function moveSlider(e) {
                $this.val(startValue + (e.pageX - startX) / $this.element.width());
            }
            $(document).css("cursor", "pointer")
                .mousemove(moveSlider)
                .mouseup(function releaseMouse(e) {
                    if (e.button == 0) {
                        for (var i = 0; i < handlers["dragend"].length; i++)
                            handlers["dragend"][i].call($this, e);
                        $(document).css("cursor", "default")
                            .off("mousemove", moveSlider)
                            .off("mouseup", releaseMouse);
                    }
                });
        }
    });

    var handlers = {
        "dragstart": [],
        "change": [],
        "dragend": []
    };
    this.on = function (type, handler) {
        if (type in handlers)
            handlers[type].push(handler);
        return this;
    }
    this.off = function (type, handler) {
        if (type in handlers) {
            var list = handlers[type],
                i = list.indexOf(handler);
            if (i != -1)
                list.slice(i, 1);
        }
        return this;
    }

    var value = 0;
    this.val = function (val) {
        if (typeof val == "number") {
            if (val < 0) val = 0;
            if (val > 1) val = 1;

            for (var i = 0; i < handlers["change"].length; i++)
                handlers["change"][i].call(this, val);

            value = val;
            val = val * 100 + "%";
            this.thumb.css("margin-left", val);
            this.foreground.css("width", val);

            return this;
        }
        else
            return value;
    }

    var enabled = true;
    this.disable = function () {
        enabled = false;
        this.thumb.hide();
        return this;
    }
    this.enable = function () {
        enabled = true;
        this.thumb.show();
        return this;
    }
}

var dragging = false;
var progress = new Slider($("#progress-wrapper")).on("dragstart", function () {
    dragging = true;
}).on("dragend", function () {
    dragging = false;
    player.prop("currentTime", this.val() * player.prop("duration"));
}).disable();

var loopButton = $("#control-loop").click(function () {
    switch (loop) {
        case 0:
            loopButton.removeClass("no-repeat").addClass("list-repeat");
            loop = 1;
            break;
        case 1:
            loopButton.removeClass("list-repeat").addClass("single-repeat");
            loop = 2;
            break;
        case 2:
            loopButton.removeClass("single-repeat").addClass("no-repeat");
            loop = 0;
            break;
    }
    localStorage.setItem("loop", loop);
});
var loop = parseInt(localStorage.getItem("loop")) || 0;
switch (loop) {
    case 0:
        loopButton.addClass("no-repeat");
        break;
    case 1:
        loopButton.addClass("list-repeat");
        break;
    case 2:
        loopButton.addClass("single-repeat");
        break;
}

var shuffleButton = $("#control-shuffle").click(function () {
    shuffleButton.toggleClass("shuffle");
    shuffle = !shuffle;
    localStorage.setItem("shuffle", shuffle);
});
if (localStorage.getItem("shuffle") == "true") {
    shuffleButton.addClass("shuffle");
    shuffle = true;
}

var previousButton = $("#control-previous").click(function () {
    if (!previousButton.hasClass("disabled")) {
        var songItems = playlist.children();
        var next;
        if (shuffle)
            next = songItems.eq(parseInt(Math.random() * (songItems.length - 2)));
        else {
            var now = songItems.index(nowPlaying);
            if (now > 0)
                now--;
            else
                now = songItems.length - 2;
            next = songItems.eq(now);
        }
        next.dblclick();
    }
});
var nextButton = $("#control-next").click(function () {
    if (!nextButton.hasClass("disabled")) {
        var songItems = playlist.children();
        var next;
        if (shuffle)
            next = songItems.eq(parseInt(Math.random() * (songItems.length - 2)));
        else {
            var now = songItems.index(nowPlaying);
            if (now < songItems.length - 2)
                next = songItems.eq(++now);
            else
                next = songItems.first();
        }
        next.dblclick();
    }
});
var playButton = $("#control-play").click(function () {
    if (!playButton.hasClass("disabled")) {
        if (playing)
            player[0].pause();
        else {
            if (player.attr("src"))
                player[0].play();
            else
                playlist.children().first().dblclick();
        }
    }
});

function toggleVolumeLevel(value) {
    if (value == 0)
        muteButton.removeClass("volume-low")
            .removeClass("volume-middle")
            .removeClass("volume-high")
            .addClass("volume-mute");
    else if (value <= 1 / 3)
        muteButton.removeClass("volume-mute")
            .removeClass("volume-middle")
            .removeClass("volume-high")
            .addClass("volume-low");
    else if (value <= 2 / 3)
        muteButton.removeClass("volume-mute")
            .removeClass("volume-low")
            .removeClass("volume-high")
            .addClass("volume-middle");
    else
        muteButton.removeClass("volume-mute")
            .removeClass("volume-low")
            .removeClass("volume-middle")
            .addClass("volume-high");
}
var oldVolume = 0, isMute = false, volumeContainer = $("#control-volume");
var muteButton = $("#volume-icon").click(function () {
    if (isMute)
        volumeSlider.val(oldVolume);
    else {
        oldVolume = player[0].volume;
        volumeSlider.val(0);
    }
    isMute = !isMute;
});
var volumeSlider = new Slider($("#volume-slider")).on("dragstart", function () {
    volumeContainer.addClass("hover");
}).on("change", function (value) {
    player[0].volume = value;
    toggleVolumeLevel(value);
    localStorage.setItem("volume", value);
}).on("dragend", function () {
    volumeContainer.removeClass("hover");
}).val(localStorage.getItem("volume") !== null ? parseFloat(localStorage.getItem("volume")) : 0.5);

var guidePanel = $("#guide");
var importButton = $("#import").click(function () {
    fileSelector.click();
});

var filter = $("#filter"),
    clear = $("#clear");
filter.keypress(function (e) {
    e.stopPropagation();
}).keyup(function (e) {
    e.stopPropagation();
    var value = filter.val();
    if (value == "") {
        clear.hide();
        playlist.children().removeClass("hide").last().addClass("hide");
    }
    else {
        clear.show();
        var regex = new RegExp(value, "i");
        playlist.children().each(function () {
            var ele = $(this);
            if (ele.text().match(regex))
                ele.removeClass("hide");
            else
                ele.addClass("hide");
        });
    }
}).on("paste", function (e) {
    setTimeout(function () {
        filter.keyup();
    }, 100);
});
clear.click(function (e) {
    filter.val("").keyup().focus();
});

$(document).keydown(function (e) {
    switch (e.keyCode) {
        case 8: // Backspace
            e.preventDefault();
            filter.val(filter.val().slice(0, -1)).keyup();
            break;
        case 46: // Delete
            e.preventDefault();
            deleteSelect();
            break;
    }
}).keypress(function (e) {
    if (e.ctrlKey && e.keyCode == 65) { // Ctrl + A
        e.preventDefault();
        playlist.find("tr:not(.hide)").addClass("info");
    }
    else if (!e.ctrlKey && !e.altKey && e.charCode != 0) {
        e.preventDefault();
        filter.val(filter.val() + String.fromCharCode(e.charCode)).keyup();
    }
});
