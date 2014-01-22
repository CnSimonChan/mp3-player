(function (window) {
    var ID3_2_GENRES = {
        "0": "Blues",
        "1": "Classic Rock",
        "2": "Country",
        "3": "Dance",
        "4": "Disco",
        "5": "Funk",
        "6": "Grunge",
        "7": "Hip-Hop",
        "8": "Jazz",
        "9": "Metal",
        "10": "New Age",
        "11": "Oldies",
        "12": "Other",
        "13": "Pop",
        "14": "R&B",
        "15": "Rap",
        "16": "Reggae",
        "17": "Rock",
        "18": "Techno",
        "19": "Industrial",
        "20": "Alternative",
        "21": "Ska",
        "22": "Death Metal",
        "23": "Pranks",
        "24": "Soundtrack",
        "25": "Euro-Techno",
        "26": "Ambient",
        "27": "Trip-Hop",
        "28": "Vocal",
        "29": "Jazz+Funk",
        "30": "Fusion",
        "31": "Trance",
        "32": "Classical",
        "33": "Instrumental",
        "34": "Acid",
        "35": "House",
        "36": "Game",
        "37": "Sound Clip",
        "38": "Gospel",
        "39": "Noise",
        "40": "AlternRock",
        "41": "Bass",
        "42": "Soul",
        "43": "Punk",
        "44": "Space",
        "45": "Meditative",
        "46": "Instrumental Pop",
        "47": "Instrumental Rock",
        "48": "Ethnic",
        "49": "Gothic",
        "50": "Darkwave",
        "51": "Techno-Industrial",
        "52": "Electronic",
        "53": "Pop-Folk",
        "54": "Eurodance",
        "55": "Dream",
        "56": "Southern Rock",
        "57": "Comedy",
        "58": "Cult",
        "59": "Gangsta",
        "60": "Top 40",
        "61": "Christian Rap",
        "62": "Pop/Funk",
        "63": "Jungle",
        "64": "Native American",
        "65": "Cabaret",
        "66": "New Wave",
        "67": "Psychadelic",
        "68": "Rave",
        "69": "Showtunes",
        "70": "Trailer",
        "71": "Lo-Fi",
        "72": "Tribal",
        "73": "Acid Punk",
        "74": "Acid Jazz",
        "75": "Polka",
        "76": "Retro",
        "77": "Musical",
        "78": "Rock & Roll",
        "79": "Hard Rock",
        "80": "Folk",
        "81": "Folk-Rock",
        "82": "National Folk",
        "83": "Swing",
        "84": "Fast Fusion",
        "85": "Bebob",
        "86": "Latin",
        "87": "Revival",
        "88": "Celtic",
        "89": "Bluegrass",
        "90": "Avantgarde",
        "91": "Gothic Rock",
        "92": "Progressive Rock",
        "93": "Psychedelic Rock",
        "94": "Symphonic Rock",
        "95": "Slow Rock",
        "96": "Big Band",
        "97": "Chorus",
        "98": "Easy Listening",
        "99": "Acoustic",
        "100": "Humour",
        "101": "Speech",
        "102": "Chanson",
        "103": "Opera",
        "104": "Chamber Music",
        "105": "Sonata",
        "106": "Symphony",
        "107": "Booty Bass",
        "108": "Primus",
        "109": "Porn Groove",
        "110": "Satire",
        "111": "Slow Jam",
        "112": "Club",
        "113": "Tango",
        "114": "Samba",
        "115": "Folklore",
        "116": "Ballad",
        "117": "Power Ballad",
        "118": "Rhythmic Soul",
        "119": "Freestyle",
        "120": "Duet",
        "121": "Punk Rock",
        "122": "Drum Solo",
        "123": "A capella",
        "124": "Euro-House",
        "125": "Dance Hall"
    };

    window.readID3 = function (file, callback) {
        "use strict";

        var tasks = 0;
        function checkTask() {
            if (!--tasks && callback instanceof Function)
                callback(tag);
        }

        var tag = { "frames": {} };

        function getString(start, length, callback, encoding) {
            var fileReader = new FileReader();
            fileReader.onload = function () {
                if (callback instanceof Function)
                    callback(this.result);
                checkTask();
            }
            tasks++;
            if (encoding)
                fileReader.readAsText(file.slice(start, start + length), encoding);
            else
                fileReader.readAsText(file.slice(start, start + length));
        }

        var fileReader = new FileReader();
        fileReader.onload = function () {
            var byteArray = new Int8Array(this.result);

            function convertInt(start) {
                start = start || 0;
                return (byteArray[start] << 21) +
                    (byteArray[start + 1] << 14) +
                    (byteArray[start + 2] << 7) +
                    (byteArray[start + 3]);
            }

            function convertString(start, length) {
                start = start || 0;
                length = length || array.length;
                if (start + length + 1 > byteArray.length)
                    length = byteArray.length - start - 1;
                return String.fromCharCode.apply(null, Array.prototype.slice.call(byteArray, start, start + length));
            }

            var position = 0;
            if (convertString(position, 3) == "ID3") {
                position += 3;
                tag["version"] = {
                    major: byteArray[position++],
                    revision: byteArray[position++]
                };
                var flagByte = byteArray[position++];
                tag["flags"] = {
                    // unsynchronisation: flagByte & (1 << 8),
                    hasExtendedHeader: flagByte & (1 << 7),
                    // experimentalIndicator: flagByte & (1 << 6)
                };
                tag["size"] = convertInt(position);
                position += 4;

                if (tag["flags"]["hasExtendedHeader"]) {
                    tag["extendedHeader"] = {
                        extendedHeaderSize: convertInt(position)
                    }

                    // Only ID3v2.3
                    // var hasCRCData = byteArray[4] & (1 << 8);

                    position += tag["extendedHeader"]["extendedHeaderSize"];
                }

                while (position < tag["size"] - 10 && byteArray[position] != 0x00) {
                    (function () {
                        var frame = {
                            id: convertString(position, 4),
                            size: convertInt(position + 4)
                        };
                        position += 10;
                        var encoding = byteArray[position++];
                        frame["size"]--;
                        if (encoding === 0x00)
                            encoding = "ISO-8859-1";
                        else if (encoding === 0x01)
                            encoding = "UTF-16";
                        else {
                            position--;
                            frame["size"]++;
                        }
                        getString(position, frame["size"], function (value) {
                            switch (frame["id"]) {
                                case "TCON":
                                    var match = value.match(/\(([0-9]+)\)/);
                                    frame["value"] = match ? ID3_2_GENRES[match[1]] : value;
                                    break;
                                default:
                                    frame["value"] = (frame["value"] || "") + value;
                                    break;
                            }
                            tag["frames"][frame["id"]] = frame["value"];
                        });
                        position += frame["size"];
                    })();
                }
            }
            checkTask();
        }
        tasks++;
        fileReader.readAsArrayBuffer(file.slice(0, 128 * 1024));

        var audio = document.createElement("audio");
        audio.addEventListener("loadedmetadata", function () {
            var duration = audio.duration;
            var second = parseInt(duration % 60);
            if (second < 10)
                second = "0" + second;
            tag["frames"]["TLEN"] = (duration > 3600 ? parseInt(duration / 3600) + ":" : "") +
                 (duration > 60 ? parseInt(duration / 60) : "0") + ":" + second;
            checkTask();
        });
        tasks++;
        audio.src = URL.createObjectURL(file);
    }
})(window);