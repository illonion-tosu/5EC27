// HTNML Structure
// <!-- Sponsors -->
// <div class="sponsors">
//     <img src="static/sponsors/Acrid Covers Logo Beige.png">
//     <img src="static/sponsors/Kagami Studio Logo Beige.png">
//     <img src="static/sponsors/SliderPals Logo Beige.png">
// </div>

const $sponsors = $(".sponsors img")

$(function () {
    const displayDuration = 6000
    const fadeDuration = 500
    let currentIndex = 0

    $sponsors.hide().eq(0).show()

    function rotateImages() {
        const nextIndex = (currentIndex + 1) % $sponsors.length

        $sponsors.eq(currentIndex).fadeOut(fadeDuration, function () {
            $sponsors.eq(nextIndex).fadeIn(fadeDuration, function () {
                currentIndex = nextIndex

                setTimeout(rotateImages, displayDuration)
            })
        })
    }

    setTimeout(rotateImages, displayDuration)
})
