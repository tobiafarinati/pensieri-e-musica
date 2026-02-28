        (function () {
            var audioDir = "audio/";
            var tracksManifest = audioDir + "tracks.json";
            var defaultTracks = [
                "aaaaaa.mp3",
                "buio.mp3",
                "curvare sotto lo sguardo .mp3",
                "ho cambiato molte stanze.mp3",
                "ho capito.mp3",
                "l’incanto.mp3",
                "macchine e produzione.mp3",
                "respiro.mp3",
                "sine.mp3",
                "sospensione.mp3"
            ];
            var tracksRoot = document.getElementById("tracks");
            var note = document.getElementById("music-note");
            var audioPlayers = [];
            var navLabels = {
                it: { thoughts: "Pensieri", music: "Musica" },
                en: { thoughts: "Thoughts", music: "Music" }
            };

            function getInitialLang() {
                var fromQuery = new URLSearchParams(window.location.search).get("lang");
                if (fromQuery === "it" || fromQuery === "en") {
                    return fromQuery;
                }

                try {
                    var stored = localStorage.getItem("siteLang");
                    if (stored === "it" || stored === "en") {
                        return stored;
                    }
                } catch (e) {}

                return "it";
            }

            function updateLangUrl(lang) {
                var url = new URL(window.location.href);
                if (lang === "en") {
                    url.searchParams.set("lang", "en");
                } else {
                    url.searchParams.delete("lang");
                }
                history.replaceState({}, "", url.pathname + (url.search ? url.search : "") + url.hash);
            }

            function switchLang(lang) {
                var safeLang = lang === "en" ? "en" : "it";
                var labels = navLabels[safeLang];

                document.documentElement.lang = safeLang;
                document.querySelectorAll(".nav-links a[data-nav]").forEach(function (link) {
                    var role = link.getAttribute("data-nav");
                    if (labels[role]) {
                        link.textContent = labels[role];
                    }
                });

                document.querySelectorAll(".nav-links a[data-nav='thoughts']").forEach(function (link) {
                    link.setAttribute("href", safeLang === "en" ? "index.html?lang=en" : "index.html");
                });

                document.querySelectorAll(".nav-links a[data-nav='music']").forEach(function (link) {
                    link.setAttribute("href", safeLang === "en" ? "music.html?lang=en" : "music.html");
                });

                document.querySelectorAll(".lang-switch a[data-lang], .lang-switch-desktop a[data-lang]").forEach(function (link) {
                    link.classList.toggle("active", link.getAttribute("data-lang") === safeLang);
                });

                try {
                    localStorage.setItem("siteLang", safeLang);
                } catch (e) {}

                updateLangUrl(safeLang);
            }

            document.querySelectorAll(".lang-switch a[data-lang], .lang-switch-desktop a[data-lang]").forEach(function (link) {
                link.addEventListener("click", function (event) {
                    event.preventDefault();
                    switchLang(link.getAttribute("data-lang"));
                });
            });

            switchLang(getInitialLang());

            function cleanFileName(href) {
                var noQuery = href.split("#")[0].split("?")[0];
                var decoded = decodeURIComponent(noQuery);
                var fileName = decoded.replace(/^\.?\//, "").replace(/^audio\//, "");
                return fileName.trim();
            }

            function displayName(fileName) {
                return fileName.replace(/\.[^/.]+$/i, "").trim();
            }

            function fileSrc(fileName) {
                return audioDir + fileName.split("/").map(encodeURIComponent).join("/");
            }

            function normalizeFileList(items) {
                if (!Array.isArray(items)) {
                    return [];
                }

                var files = items
                    .map(function (value) {
                        return cleanFileName(String(value));
                    })
                    .filter(function (fileName) {
                        return /\.(mp3|wav|ogg|m4a)$/i.test(fileName);
                    });

                return Array.from(new Set(files)).sort(function (a, b) {
                    return a.localeCompare(b, "it", { numeric: true, sensitivity: "base" });
                });
            }

            function setNote(text) {
                if (!note) {
                    return;
                }
                note.textContent = text;
            }

            function formatTime(seconds) {
                if (!isFinite(seconds)) {
                    return "--:--";
                }

                var total = Math.max(0, Math.floor(seconds));
                var minutes = Math.floor(total / 60);
                var secs = total % 60;
                return String(minutes).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
            }

            function syncPlayer(audio, button, fill, time) {
                var progress = 0;
                if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                    progress = Math.max(0, Math.min(100, (audio.currentTime / audio.duration) * 100));
                }

                fill.style.width = progress + "%";
                button.textContent = audio.paused ? "play" : "pause";
                time.textContent = formatTime(audio.currentTime) + " / " + formatTime(audio.duration);
            }

            function seekToEvent(audio, progressBar, event) {
                var rect = progressBar.getBoundingClientRect();
                if (!rect.width) {
                    return;
                }

                var pointX = getClientX(event);
                if (!isFinite(pointX)) {
                    return;
                }

                var clickX = pointX - rect.left;
                var ratio = Math.max(0, Math.min(1, clickX / rect.width));
                if (audio.duration && isFinite(audio.duration)) {
                    audio.currentTime = ratio * audio.duration;
                }
            }

            function getClientX(event) {
                if (typeof event.clientX === "number") {
                    return event.clientX;
                }
                if (event.touches && event.touches.length) {
                    return event.touches[0].clientX;
                }
                if (event.changedTouches && event.changedTouches.length) {
                    return event.changedTouches[0].clientX;
                }
                return NaN;
            }

            function bindProgressInteractions(audio, progressBar) {
                var isDragging = false;

                function seekAndPrevent(event) {
                    if (event.cancelable) {
                        event.preventDefault();
                    }
                    seekToEvent(audio, progressBar, event);
                }

                if (window.PointerEvent) {
                    progressBar.addEventListener("pointerdown", function (event) {
                        isDragging = true;
                        if (progressBar.setPointerCapture && typeof event.pointerId === "number") {
                            progressBar.setPointerCapture(event.pointerId);
                        }
                        seekAndPrevent(event);
                    });

                    progressBar.addEventListener("pointermove", function (event) {
                        if (!isDragging) {
                            return;
                        }
                        seekAndPrevent(event);
                    });

                    progressBar.addEventListener("pointerup", function (event) {
                        if (!isDragging) {
                            return;
                        }
                        isDragging = false;
                        seekAndPrevent(event);
                    });

                    progressBar.addEventListener("pointercancel", function () {
                        isDragging = false;
                    });
                    return;
                }

                // Fallback for old mobile browsers without Pointer Events
                progressBar.addEventListener("touchstart", function (event) {
                    isDragging = true;
                    seekAndPrevent(event);
                }, { passive: false });

                progressBar.addEventListener("touchmove", function (event) {
                    if (!isDragging) {
                        return;
                    }
                    seekAndPrevent(event);
                }, { passive: false });

                progressBar.addEventListener("touchend", function (event) {
                    if (!isDragging) {
                        return;
                    }
                    isDragging = false;
                    seekAndPrevent(event);
                }, { passive: false });

                progressBar.addEventListener("touchcancel", function () {
                    isDragging = false;
                });

                progressBar.addEventListener("mousedown", function (event) {
                    isDragging = true;
                    seekAndPrevent(event);
                });

                document.addEventListener("mousemove", function (event) {
                    if (!isDragging) {
                        return;
                    }
                    seekAndPrevent(event);
                });

                document.addEventListener("mouseup", function (event) {
                    if (!isDragging) {
                        return;
                    }
                    isDragging = false;
                    seekAndPrevent(event);
                });
            }

            function createTrack(fileName) {
                var track = document.createElement("div");
                track.className = "track";

                var title = document.createElement("div");
                title.className = "track-title";
                title.textContent = displayName(fileName);

                var audio = document.createElement("audio");
                audio.className = "track-audio";
                audio.preload = "metadata";
                audio.src = fileSrc(fileName);
                audio.setAttribute("playsinline", "");

                var player = document.createElement("div");
                player.className = "track-player";

                var button = document.createElement("button");
                button.type = "button";
                button.className = "player-btn";
                button.textContent = "play";
                button.setAttribute("aria-label", "Riproduci " + title.textContent);

                var progressBar = document.createElement("div");
                progressBar.className = "player-progress";
                progressBar.setAttribute("role", "progressbar");
                progressBar.setAttribute("aria-label", "Progresso " + title.textContent);
                progressBar.setAttribute("aria-valuemin", "0");
                progressBar.setAttribute("aria-valuemax", "100");
                progressBar.setAttribute("aria-valuenow", "0");

                var fill = document.createElement("div");
                fill.className = "player-progress-fill";
                progressBar.appendChild(fill);

                var time = document.createElement("div");
                time.className = "player-time";
                time.textContent = "00:00 / --:--";

                button.addEventListener("click", function () {
                    if (audio.paused) {
                        audio.play();
                    } else {
                        audio.pause();
                    }
                });

                progressBar.addEventListener("click", function (event) {
                    seekToEvent(audio, progressBar, event);
                });
                bindProgressInteractions(audio, progressBar);

                audio.addEventListener("play", function () {
                    audioPlayers.forEach(function (otherAudio) {
                        if (otherAudio !== audio) {
                            otherAudio.pause();
                        }
                    });
                    syncPlayer(audio, button, fill, time);
                });

                audio.addEventListener("pause", function () {
                    syncPlayer(audio, button, fill, time);
                });

                audio.addEventListener("loadedmetadata", function () {
                    syncPlayer(audio, button, fill, time);
                });

                audio.addEventListener("timeupdate", function () {
                    progressBar.setAttribute(
                        "aria-valuenow",
                        String(audio.duration ? Math.round((audio.currentTime / audio.duration) * 100) : 0)
                    );
                    syncPlayer(audio, button, fill, time);
                });

                audio.addEventListener("ended", function () {
                    syncPlayer(audio, button, fill, time);
                });

                track.appendChild(title);
                track.appendChild(player);
                player.appendChild(button);
                player.appendChild(progressBar);
                player.appendChild(time);
                track.appendChild(audio);
                audioPlayers.push(audio);
                return track;
            }

            async function getTracksFromManifest() {
                var response = await fetch(tracksManifest, { cache: "no-store" });
                if (!response.ok) {
                    throw new Error("Manifest non disponibile");
                }

                var data = await response.json();
                var files = normalizeFileList(data);
                if (!files.length) {
                    throw new Error("Manifest vuoto o non valido");
                }

                return files;
            }

            async function getTracksFromDirectoryListing() {
                var response = await fetch(audioDir, { cache: "no-store" });
                if (!response.ok) {
                    throw new Error("Directory listing non disponibile");
                }

                var html = await response.text();
                var doc = new DOMParser().parseFromString(html, "text/html");
                var links = Array.prototype.slice.call(doc.querySelectorAll("a[href]"));
                var files = links
                    .map(function (link) {
                        return cleanFileName(link.getAttribute("href"));
                    });
                return normalizeFileList(files);
            }

            function getTracksFromFallbackList() {
                return normalizeFileList(defaultTracks);
            }

            function renderTracks(files) {
                tracksRoot.innerHTML = "";

                if (!files.length) {
                    setNote("Nessun audio trovato in audio/. Aggiungi file .mp3 e ricarica la pagina.");
                    return;
                }

                setNote("");
                files.forEach(function (fileName) {
                    tracksRoot.appendChild(createTrack(fileName));
                });
            }

            getTracksFromManifest()
                .catch(function () {
                    return getTracksFromDirectoryListing();
                })
                .catch(function () {
                    return getTracksFromFallbackList();
                })
                .then(renderTracks)
                .catch(function () {
                    setNote("Non riesco a caricare gli audio. Verifica che i file siano pubblicati nella cartella audio/.");
                    tracksRoot.innerHTML = "";
                });
        })();
