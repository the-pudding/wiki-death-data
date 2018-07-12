PHONY: clean-dir copy-data reproduce

clean-dir:
	rm -rf output
	mkdir output

copy-data:
	cp explore-data/*.csv exploration/data/
	cp explore-data/*.csv /Users/russell/Pudding/projects/wiki-death/src/assets/data

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
	prepare-explore

	make copy-data
