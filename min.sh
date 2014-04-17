src='Paragon.js'
dest='Paragon.min.js'
map="$dest.map"
min="${1:-true}"

#debug='--debug --formatting PRETTY_PRINT'

if [ "$min" != 'true' ] ; then
	m="$(cat "$src")"
elif false which closure &>/dev/null ; then
	m="$(closure --language_in ECMASCRIPT5_STRICT --js "$src" \
	             $debug \
	             --compilation_level SIMPLE_OPTIMIZATIONS \
	             --create_source_map "$map" --source_map_format V3
	    )"
elif which uglifyjs &>/dev/null ; then
	m="$(uglifyjs "$src" -cm --screw-ie8 \
	               --source-map "$map" --source-map-include-sources
	    )"
else
	echo "Error: No minifier found.  Copping to dest."
	m="$(cat "$src")"
fi

echo "$m" > "$dest"
