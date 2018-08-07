PHONY: clean-dir copy-data reproduce pudding

clean-dir:
	rm -rf output
	mkdir output

copy-data:
	cp web-data/*.csv /Users/russell/Pudding/projects/wiki-death/src/assets/data

reproduce:
	make clean-dir

	run-s \
	download-year-pages \
	parse-year-pages \
	get-wiki-pageviews \
	get-people-pageviews \
	bin \
	stats \
	filter-population \
	add-details \
	prepare-web

pudding:
	make reproduce
	make copy-data
