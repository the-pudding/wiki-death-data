copy-data:
	cp web-data/*.csv exploration/data/

reproduce:
	rm -rf output
	mkdir output
	run-s download-year-pages parse-year-pages get-wiki-pageviews get-people-pageviews join-people explore filter-population add-details prepare-web
	make copy-data
