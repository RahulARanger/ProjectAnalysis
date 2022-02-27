function loadThings(message = "", load = true) {
	const loader = document.querySelector(".pageloader");
	load
		? loader.classList.add("is-active")
		: loader.classList.remove("is-active");

	document.querySelector(".pageloader > .title").textContent =
		message || "Loading Page" + ".".repeat(Math.random() * 3);
}

function selected(new_path, ask = false) {
	const select = document.getElementById("selected");
	if (ask) {
		return select.textContent;
	}
	select.textContent = new_path;
}

document.querySelector(".button").addEventListener("click", () => alert("ask"));
document
	.querySelector(".button:last-child")
	.addEventListener("click", function () {
		const select = selected(null, true);
		select ? alert("u " + select) : null;
	});
