src='Paragon.js'
dest="${1:-Paragon.min.js}"
map="$dest.map"

#debug='--debug --formatting PRETTY_PRINT'

if which uglifyjs &>/dev/null ; then
	uglifyjs "$src" -cm --screw-ie8 \
	               --source-map "$map" --source-map-include-sources > "$dest"
elif which closure &>/dev/null ; then
	closure --language_in ECMASCRIPT5_STRICT --js "$src" \
	        $debug \
	        --compilation_level SIMPLE_OPTIMIZATIONS \
	        --create_source_map "$map" --source_map_format V3 > "$dest"
else
	echo "Error: No minifier found.  Copping to dest."
	cp "$src" "$dest"
fi
