//<nowiki>


(function($){


/*
 ****************************************
 *** twinklewarn.js: Warn module
 ****************************************
 * Mode of invocation:     Tab ("Warn")
 * Active on:              User (talk) pages and (deleted) Contributions
 * Config directives in:   TwinkleConfig
 */

Twinkle.warn = function twinklewarn() {
	if( mw.config.get( 'wgRelevantUserName' ) ) {
			Twinkle.addPortletLink( Twinkle.warn.callback, "Peringati", "tw-warn", "Peringatkan/beritahukan pengguna" );
			if (Twinkle.getPref('autoMenuAfterRollback') && mw.config.get('wgNamespaceNumber') === 3 && mw.util.getParamValue('vanarticle') && !mw.util.getParamValue('friendlywelcome')) {
				Twinkle.warn.callback();
			}
	}

	// Modify URL of talk page on rollback success pages, makes use of a
	// custom message box in [[MediaWiki:Rollback-success]]
	if( mw.config.get('wgAction') === 'rollback' ) {
		var $vandalTalkLink = $("#mw-rollback-success").find(".mw-usertoollinks a").first();
		if ( $vandalTalkLink.length ) {
			$vandalTalkLink.css("font-weight", "bold");
			$vandalTalkLink.wrapInner($("<span/>").attr("title", "Jika sesuai, Anda dapat menggunakan Twinkle untuk memperingatkan pengguna terkait suntingan mereka pada halaman ini."));

			var extraParam = "vanarticle=" + mw.util.rawurlencode(Morebits.pageNameNorm);
			var href = $vandalTalkLink.attr("href");
			if (href.indexOf("?") === -1) {
				$vandalTalkLink.attr("href", href + "?" + extraParam);
			} else {
				$vandalTalkLink.attr("href", href + "&" + extraParam);
			}
		}
	}
};

Twinkle.warn.callback = function twinklewarnCallback() {
	if( mw.config.get( 'wgRelevantUserName' ) === mw.config.get( 'wgUserName' ) &&
			!confirm( 'Anda hendak memperingatkan diri sendiri! Apakah Anda yakin ingin melakukannya?' ) ) {
		return;
	}

	var Window = new Morebits.simpleWindow( 600, 440 );
	Window.setTitle( "Peringatkan/beritahu pengguna" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Memilih tingkat peringatan", "WP:UWUL#Levels" );
	Window.addFooterLink( "Bantuan Twinkle", "WP:TW/DOC#Warn_.28peringatan_di_pembicaraan_pengguna.29" );

	var form = new Morebits.quickForm( Twinkle.warn.callback.evaluate );
	var main_select = form.append( {
			type: 'field',
			label: 'Pilih jenis peringatan/pemberitahuan untuk ditampilkan',
			tooltip: 'Pilih dahulu kelompok peringatan utama, lalu peringatan spesifik untuk ditampilkan.'
		} );

	var main_group = main_select.append( {
			type: 'select',
			name: 'main_group',
			event:Twinkle.warn.callback.change_category
		} );

	var defaultGroup = parseInt(Twinkle.getPref('defaultWarningGroup'), 10);
	main_group.append( { type: 'option', label: '1: Catatan umum', value: 'level1', selected: ( defaultGroup === 1 ) } );
	main_group.append( { type: 'option', label: '2: Pemberitahuan', value: 'level2', selected: ( defaultGroup === 2 ) } );
	main_group.append( { type: 'option', label: '3: Peringatan', value: 'level3', selected: ( defaultGroup === 3 ) } );
	main_group.append( { type: 'option', label: '4: Peringatan terakhir', value: 'level4', selected: ( defaultGroup === 4 ) } );
	main_group.append( { type: 'option', label: '4im: Sekadar peringatan', value: 'level4im', selected: ( defaultGroup === 5 ) } );
	main_group.append( { type: 'option', label: 'Pemberitahuan isu tunggal', value: 'singlenotice', selected: ( defaultGroup === 6 ) } );
	main_group.append( { type: 'option', label: 'Peringatan isu tunggal', value: 'singlewarn', selected: ( defaultGroup === 7 ) } );
	if( Twinkle.getPref( 'customWarningList' ).length ) {
		main_group.append( { type: 'option', label: 'Peringatan kustom', value: 'custom', selected: ( defaultGroup === 9 ) } );
	}

	main_select.append( { type: 'select', name: 'sub_group', event:Twinkle.warn.callback.change_subcategory } ); //Will be empty to begin with.

	form.append( {
			type: 'input',
			name: 'article',
			label: 'Artikel terkait',
			value:( Morebits.queryString.exists( 'vanarticle' ) ? Morebits.queryString.get( 'vanarticle' ) : '' ),
			tooltip: 'Suatu artikel dapat ditautkan dalam pemberitahuan ini, mungkin karena merupakan pengembalian atas artikel terkait pemberitahuan ini. Biarkan kosong jika tidak ada artikel yang ingin ditautkan.'
		} );

	var more = form.append( { type: 'field', name: 'reasonGroup', label: 'Informasi peringatan' } );
	more.append( { type: 'textarea', label: 'Pesan opsional:', name: 'reason', tooltip: 'Mungkin suatu alasan atau, jika tidak, diperlukan tambahan pemberitahuan yang lebih rinci.' } );

	var previewlink = document.createElement( 'a' );
	$(previewlink).click(function(){
		Twinkle.warn.callbacks.preview(result);  // |result| is defined below
	});
	previewlink.style.cursor = "pointer";
	previewlink.textContent = 'Lihat pratayang';
	more.append( { type: 'div', id: 'warningpreview', label: [ previewlink ] } );
	more.append( { type: 'div', id: 'twinklewarn-previewbox', style: 'display: none' } );

	more.append( { type: 'submit', label: 'Kirimkan' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();
	result.main_group.root = result;
	result.previewer = new Morebits.wiki.preview($(result).find('div#twinklewarn-previewbox').last()[0]);

	// We must init the first choice (General Note);
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.main_group.dispatchEvent( evt );
};

// This is all the messages that might be dispatched by the code
// Each of the individual templates require the following information:
//   label (required): A short description displayed in the dialog
//   summary (required): The edit summary used. If an article name is entered, the summary is postfixed with "on [[article]]", and it is always postfixed with ". $summaryAd"
//   suppressArticleInSummary (optional): Set to true to suppress showing the article name in the edit summary. Useful if the warning relates to attack pages, or some such.
Twinkle.warn.messages = {
	level1: {
		"Peringatan umum": {
			"uw-vandalism1": {
				label: "Vandalisme",
				summary: "Catatan: Suntingan merusak"
			},
			"uw-disruptive1": {
				label: "Suntingan tidak membangun",
				summary: "Catatan: Suntingan tidak membangun"
			},
			"uw-test1": {
				label: "Suntingan uji coba",
				summary: "Catatan: Suntingan uji coba"
			},
			"uw-delete1": {
				label: "Menghapus konten, mengosongkan halaman",
				summary: "Catatan: Penghapusan konten, pengosongan halaman"
			}
		},
		"Perilaku dalam artikel": {
			"uw-biog1": {
				label: "Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup",
				summary: "Catatan: Penambahan informasi kontroversial tanpa rujukan tentang orang yang masih hidup"
			},
			"uw-defamatory1": {
				label: "Menambahkan konten yang memfitnah",
				summary: "Catatan: Penambahan konten yang memfitnah"
			},
			"uw-error1": {
				label: "Menambahkan kesalahan faktual secara sengaja",
				summary: "Catatan: Penambahan kesalahan faktual secara sengaja"
			},
			"uw-genre1": {
				label: "Mengubah secara massal atau sering tanpa konsensus atau rujukan",
				summary: "Catatan: Pengubahan secara massal atau sering tanpa konsensus atau rujukan"
			},
			"uw-image1": {
				label: "Vandalisme terkait berkas dalam artikel",
				summary: "Catatan: Vandalisme terkait berkas dalam artikel"
			},
			"uw-joke1": {
				label: "Menggunakan lelucon yang tidak pantas dalam artikel",
				summary: "Catatan: Penggunaan lelucon yang tidak pantas dalam artikel"
			},
			"uw-nor1": {
				label: "Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan",
				summary: "Catatan: Penambahan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan"
			},
			"uw-notcensored1": {
				label: "Menyensor materi",
				summary: "Catatan: Penyensoran materi"
			},
			"uw-own1": {
				label: "Mengklaim kepemilikan artikel",
				summary: "Catatan: Klaim kepemilikan artikel"
			},
			"uw-tdel1": {
				label: "Menghapus templat pemeliharaan",
				summary: "Catatan: Penghapusan templat pemeliharaan"
			},
			"uw-unsourced1": {
				label: "Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan",
				summary: "Catatan: Penambahan materi tanpa dikutip dengan semestinya atau tanpa rujukan"
			}
		},
		"Promosi dan spam": {
			"uw-advert1": {
				label: "Menggunakan Wikipedia untuk beriklan atau promosi",
				summary: "Catatan: Penggunaan Wikipedia untuk beriklan atau promosi"
			},
			"uw-npov1": {
				label: "Tidak berpegang pada sudut pandang netral",
				summary: "Catatan: Tidak berpegang pada sudut pandang netral"
			},
			"uw-paid1": {
				label: "Paid editing without disclosure under the Wikimedia Terms of Use",
				summary: "General note: Paid editing without disclosure under the Wikimedia Terms of Use"
			},
			"uw-spam1": {
				label: "Menambahkan pranala spam",
				summary: "Catatan: Penambahan pranala spam"
			}
		},
		"Perilaku terhadap pengguna lain": {
			"uw-agf1": {
				label: "Tidak mengasumsikan niat baik",
				summary: "Catatan: Tidak mengasumsikan niat baik"
			},
			"uw-harass1": {
				label: "Melecehkan pengguna lain",
				summary: "Catatan: Pelecehan terhadap pengguna lain"
			},
			"uw-npa1": {
				label: "Serangan pribadi terhadap pengguna tertentu",
				summary: "Catatan: Serangan pribadi terhadap pengguna tertentu"
			},
			"uw-tempabuse1": {
				label: "Menyalahgunakan templat pemblokiran atau peringatan",
				summary: "Catatan: Penyalahgunaan templat pemblokiran atau peringatan"
			}
		},
		"Penghilangan tag penghapusan": {
			"uw-afd1": {
				label: "Menghilangkan templat {{Afd}}",
				summary: "Catatan: Penghilangan templat {{Afd}}"
			},
			"uw-blpprod1": {
				label: "Menghilangkan templat {{Prod blp}}",
				summary: "Catatan: Penghilangan templat {{Prod blp}}"
			},
			"uw-idt1": {
				label: "Menghilangkan tag penghapusan berkas",
				summary: "Catatan: Penghilangan tag penghapusan berkas"
			},
			"uw-speedy1": {
				label: "Menghilangkan tag penghapusan cepat",
				summary: "Catatan: Penghilangan tag penghapusan cepat"
			}
		},
		"Lain-lain": {
			"uw-attempt1": {
				label: "Memicu filter penyuntingan",
				summary: "Catatan: Memicu filter penyuntingan"
			},
			"uw-chat1": {
				label: "Menggunakan halaman pembicaraan sebagai forum",
				summary: "Catatan: Penggunaan halaman pembicaraan sebagai forum"
			},
			"uw-create1": {
				label: "Membuat halaman yang tidak pantas",
				summary: "Catatan: Pembuatan halaman yang tidak pantas"
			},
			"uw-mos1": {
				label: "Pedoman gaya",
				summary: "Catatan: Format, tanggal, bahasa, dll. (Pedoman gaya)"
			},
			"uw-move1": {
				label: "Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus",
				summary: "Catatan: Pemindahan halaman bertentangan dengan konvensi penamaan atau konsensus"
			},
			"uw-tpv1": {
				label: "Menyunting komentar pengguna lain di halaman pembicaraan",
				summary: "Catatan: Penyuntingan komentar pengguna lain di halaman pembicaraan"
			},
			"uw-upload1": {
				label: "Menggunggah berkas nonensiklopedis",
				summary: "Catatan: Pengunggahan berkas nonensiklopedis"
			}
		}
	},


	level2: {
		"Peringatan umum": {
			"uw-vandalism2": {
				label: "Vandalisme",
				summary: "Pemberitahuan: Suntingan merusak"
			},
			"uw-disruptive2": {
				label: "Suntingan tidak membangun",
				summary: "Pemberitahuan: Suntingan tidak membangun"
			},
			"uw-test2": {
				label: "Suntingan uji coba",
				summary: "Pemberitahuan: Suntingan uji coba"
			},
			"uw-delete2": {
				label: "Menghapus konten, mengosongkan halaman",
				summary: "Pemberitahuan: Penghapusan konten, pengosongan halaman"
			}
		},
		"Perilaku dalam artikel": {
			"uw-biog2": {
				label: "Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup",
				summary: "Pemberitahuan: Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup"
			},
			"uw-defamatory2": {
				label: "Menambahkan konten yang memfitnah",
				summary: "Pemberitahuan: Penambahan konten yang memfitnah"
			},
			"uw-error2": {
				label: "Menambahkan kesalahan faktual secara sengaja",
				summary: "Pemberitahuan: Penambahan kesalahan faktual secara sengaja"
			},
			"uw-genre2": {
				label: "Mengubah secara massal atau sering tanpa konsensus atau rujukan",
				summary: "Pemberitahuan: Pengubahan secara massal atau sering tanpa konsensus atau rujukan"
			},
			"uw-image2": {
				label: "Vandalisme terkait berkas dalam artikel",
				summary: "Pemberitahuan: Vandalisme terkait berkas dalam artikel"
			},
			"uw-joke2": {
				label: "Menggunakan lelucon yang tidak pantas dalam artikel",
				summary: "Pemberitahuan: Penggunaan lelucon yang tidak pantas dalam artikel"
			},
			"uw-nor2": {
				label: "Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan",
				summary: "Pemberitahuan: Penambahan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan"
			},
			"uw-notcensored2": {
				label: "Menyensor materi",
				summary: "Pemberitahuan: Penyensoran materi"
			},
			"uw-own2": {
				label: "Mengklaim kepemilikan artikel",
				summary: "Pemberitahuan: Klaim kepemilikan artikel"
			},
			"uw-tdel2": {
				label: "Menghapus templat pemeliharaan",
				summary: "Pemberitahuan: Penghapusan templat pemeliharaan"
			},
			"uw-unsourced2": {
				label: "Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan",
				summary: "Pemberitahuan: Penambahan materi tanpa dikutip dengan semestinya atau tanpa rujukan"
			}
		},
		"Promosi dan spam": {
			"uw-advert2": {
				label: "Menggunakan Wikipedia untuk beriklan atau promosi",
				summary: "Pemberitahuan: Penggunaan Wikipedia untuk beriklan atau promosi"
			},
			"uw-npov2": {
				label: "Tidak berpegang pada sudut pandang netral",
				summary: "Pemberitahuan: Tidak berpegang pada sudut pandang netral"
			},
			"uw-paid2": {
				label: "Paid editing without disclosure under the Wikimedia Terms of Use",
				summary: "Caution: Paid editing without disclosure under the Wikimedia Terms of Use"
			},
			"uw-spam2": {
				label: "Menambahkan pranala spam",
				summary: "Pemberitahuan: Penambahan pranala spam"
			}
		},
		"Perilaku terhadap pengguna lain": {
			"uw-agf2": {
				label: "Tidak mengasumsikan niat baik",
				summary: "Pemberitahuan: Tidak mengasumsikan niat baik"
			},
			"uw-harass2": {
				label: "Melecehkan pengguna lain",
				summary: "Pemberitahuan: Pelecehan terhadap pengguna lain"
			},
			"uw-npa2": {
				label: "Serangan pribadi terhadap pengguna tertentu",
				summary: "Pemberitahuan: Serangan pribadi terhadap pengguna tertentu"
			},
			"uw-tempabuse2": {
				label: "Menyalahgunakan templat pemblokiran atau peringatan",
				summary: "Pemberitahuan: Penyalahgunaan templat pemblokiran atau peringatan"
			}
		},
		"Penghilangan tag penghapusan": {
			"uw-afd2": {
				label: "Menghilangkan templat {{Afd}}",
				summary: "Pemberitahuan: Penghilangan templat {{Afd}}"
			},
			"uw-blpprod2": {
				label: "Menghilangkan templat {{Prod blp}}",
				summary: "Pemberitahuan: Penghilangan templat {{Prod blp}}"
			},
			"uw-idt2": {
				label: "Menghilangkan tag penghapusan berkas",
				summary: "Pemberitahuan: Penghilangan tag penghapusan berkas"
			},
			"uw-speedy2": {
				label: "Menghilangkan tag penghapusan cepat",
				summary: "Pemberitahuan: Penghilangan tag penghapusan cepat"
			}
		},
		"Lain-lain": {
			"uw-attempt2": {
				label: "Memicu filter penyuntingan",
				summary: "Pemberitahuan: Memicu filter penyuntingan"
			},
			"uw-chat2": {
				label: "Menggunakan halaman pembicaraan sebagai forum",
				summary: "Pemberitahuan: Penggunaan halaman pembicaraan sebagai forum"
			},
			"uw-create2": {
				label: "Membuat halaman yang tidak pantas",
				summary: "Pemberitahuan: Pembuatan halaman yang tidak pantas"
			},
			"uw-mos2": {
				label: "Pedoman gaya",
				summary: "Pemberitahuan: Format, tanggal, bahasa, dll. (Pedoman gaya)"
			},
			"uw-move2": {
				label: "Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus",
				summary: "Pemberitahuan: Pemindahan halaman bertentangan dengan konvensi penamaan atau konsensus"
			},
			"uw-tpv2": {
				label: "Menyunting komentar pengguna lain di halaman pembicaraan",
				summary: "Pemberitahuan: Penyuntingan komentar pengguna lain di halaman pembicaraan"
			},
			"uw-upload2": {
				label: "Menggunggah berkas nonensiklopedis",
				summary: "Pemberitahuan: Pengunggahan berkas nonensiklopedis"
			}
		}
	},


	level3: {
		"Peringatan umum": {
			"uw-vandalism3": {
				label: "Vandalisme",
				summary: "Peringatan: Vandalisme"
			},
			"uw-disruptive3": {
				label: "Suntingan tidak membangun",
				summary: "Peringatan: Suntingan tidak membangun"
			},
			"uw-test3": {
				label: "Suntingan uji coba",
				summary: "Peringatan: Suntingan uji coba"
			},
			"uw-delete3": {
				label: "Menghapus konten, mengosongkan halaman",
				summary: "Peringatan: Penghapusan konten, pengosongan halaman"
			}
		},
		"Perilaku dalam artikel": {
			"uw-biog3": {
				label: "Menambahkan informasi fitnah/kontroversial tanpa rujukan tentang orang yang masih hidup",
				summary: "Peringatan: Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup"
			},
			"uw-defamatory3": {
				label: "Menambahkan konten yang memfitnah",
				summary: "Peringatan: Penambahan konten yang memfitnah"
			},
			"uw-error3": {
				label: "Menambahkan kesalahan faktual secara sengaja",
				summary: "Peringatan: Penambahan kesalahan faktual secara sengaja"
			},
			"uw-genre3": {
				label: "Mengubah secara massal atau sering tanpa konsensus atau rujukan",
				summary: "Peringatan: Pengubahan secara massal atau sering tanpa konsensus atau rujukan"
			},
			"uw-image3": {
				label: "Vandalisme terkait berkas dalam artikel",
				summary: "Peringatan: Vandalisme terkait berkas dalam artikel"
			},
			"uw-joke3": {
				label: "Menggunakan lelucon yang tidak pantas dalam artikel",
				summary: "Peringatan: Penggunaan lelucon yang tidak pantas dalam artikel"
			},
			"uw-nor3": {
				label: "Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan",
				summary: "Peringatan: Penambahan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan"
			},
			"uw-notcensored3": {
				label: "Menyensor materi",
				summary: "Peringatan: Penyensoran materi"
			},
			"uw-own3": {
				label: "Mengklaim kepemilikan artikel",
				summary: "Peringatan: Klaim kepemilikan artikel"
			},
			"uw-tdel3": {
				label: "Menghapus templat pemeliharaan",
				summary: "Peringatan: Penghapusan templat pemeliharaan"
			},
			"uw-unsourced3": {
				label: "Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan",
				summary: "Peringatan: Penambahan materi tanpa dikutip dengan semestinya atau tanpa rujukan"
			}
		},
		"Promosi dan spam": {
			"uw-advert3": {
				label: "Menggunakan Wikipedia untuk beriklan atau promosi",
				summary: "Peringatan: Penggunaan Wikipedia untuk beriklan atau promosi"
			},
			"uw-npov3": {
				label: "Tidak berpegang pada sudut pandang netral",
				summary: "Peringatan: Tidak berpegang pada sudut pandang netral"
			},
			"uw-paid3": {
				label: "Paid editing without disclosure under the Wikimedia Terms of Use",
				summary: "Warning: Paid editing without disclosure under the Wikimedia Terms of Use"
			},
			"uw-spam3": {
				label: "Menambahkan pranala spam",
				summary: "Peringatan: Penambahan pranala spam"
			}
		},
		"Perilaku terhadap pengguna lain": {
			"uw-agf3": {
				label: "Tidak mengasumsikan niat baik",
				summary: "Peringatan: Tidak mengasumsikan niat baik"
			},
			"uw-harass3": {
				label: "Melecehkan pengguna lain",
				summary: "Peringatan: Pelecehan terhadap pengguna lain"
			},
			"uw-npa3": {
				label: "Serangan pribadi terhadap pengguna tertentu",
				summary: "Peringatan: Serangan pribadi terhadap pengguna tertentu"
			}
		},
		"Penghilangan tag penghapusan": {
			"uw-afd3": {
				label: "Menghilangkan templat {{Afd}}",
				summary: "Peringatan: Penghilangan templat {{Afd}}"
			},
			"uw-blpprod3": {
				label: "Menghilangkan templat {{Prod blp}}",
				summary: "Peringatan: Penghilangan templat {{Prod blp}}"
			},
			"uw-idt3": {
				label: "Menghilangkan tag penghapusan berkas",
				summary: "Peringatan: Penghilangan tag penghapusan berkas"
			},
			"uw-speedy3": {
				label: "Menghilangkan tag penghapusan cepat",
				summary: "Peringatan: Penghilangan tag penghapusan cepat"
			}
		},
		"Lain-lain": {
			"uw-attempt3": {
				label: "Memicu filter penyuntingan",
				summary: "Peringatan: Memicu filter penyuntingan"
			},
			"uw-chat3": {
				label: "Menggunakan halaman pembicaraan sebagai forum",
				summary: "Peringatan: Penggunaan halaman pembicaraan sebagai forum"
			},
			"uw-create3": {
				label: "Membuat halaman yang tidak pantas",
				summary: "Peringatan: Pembuatan halaman yang tidak pantas"
			},
			"uw-mos3": {
				label: "Pedoman gaya",
				summary: "Peringatan: Format, tanggal, bahasa, dll. (Pedoman gaya)"
			},
			"uw-move3": {
				label: "Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus",
				summary: "Peringatan: Pemindahan halaman bertentangan dengan konvensi penamaan atau konsensus"
			},
			"uw-tpv3": {
				label: "Menyunting komentar pengguna lain di halaman pembicaraan",
				summary: "Peringatan: Penyuntingan komentar pengguna lain di halaman pembicaraan"
			},
			"uw-upload3": {
				label: "Menggunggah berkas nonensiklopedis",
				summary: "Peringatan: Pengunggahan berkas nonensiklopedis"
			}
		}
	},


	level4: {
		"Peringatan umum": {
			"uw-vandalism4": {
				label: "Vandalisme",
				summary: "Peringatan terakhir: Vandalisme"
			},
			"uw-generic4": {
				label: "Peringatan umum (untuk templat yang tidak ada di tingkat 4)",
				summary: "Pemberitahuan peringatan terakhir"
			},
			"uw-delete4": {
				label: "Menghapus konten, mengosongkan halaman",
				summary: "Peringatan terakhir: Penghapusan konten, pengosongan halaman"
			}
		},
		"Perilaku dalam artikel": {
			"uw-biog4": {
				label: "Menambahkan informasi fitnah tanpa rujukan tentang orang yang masih hidup",
				summary: "Peringatan terakhir: Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup"
			},
			"uw-defamatory4": {
				label: "Menambahkan konten yang memfitnah",
				summary: "Peringatan terakhir: Penambahan konten yang memfitnah"
			},
			"uw-error4": {
				label: "Menambahkan kesalahan faktual secara sengaja",
				summary: "Peringatan terakhir: Penambahan kesalahan faktual secara sengaja"
			},
			"uw-genre4": {
				label: "Mengubah secara massal atau sering tanpa konsensus atau rujukan",
				summary: "Peringatan terakhir: Pengubahan secara massal atau sering tanpa konsensus atau rujukan"
			},
			"uw-image4": {
				label: "Vandalisme terkait berkas dalam artikel",
				summary: "Peringatan terakhir: Vandalisme terkait berkas dalam artikel"
			},
			"uw-joke4": {
				label: "Menggunakan lelucon yang tidak pantas dalam artikel",
				summary: "Peringatan terakhir: Penggunaan lelucon yang tidak pantas dalam artikel"
			},
			"uw-nor4": {
				label: "Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan",
				summary: "Peringatan terakhir: Penambahan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan"
			},
			"uw-tdel4": {
				label: "Menghapus templat pemeliharaan",
				summary: "Peringatan terakhir: Penghapusan templat pemeliharaan"
			},
			"uw-unsourced4": {
				label: "Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan",
				summary: "Peringatan terakhir: Penambahan materi tanpa dikutip dengan semestinya atau tanpa rujukan"
			}
		},
		"Promosi dan spam": {
			"uw-advert4": {
				label: "Menggunakan Wikipedia untuk beriklan atau promosi",
				summary: "Peringatan terakhir: Penggunaan Wikipedia untuk beriklan atau promosi"
			},
			"uw-npov4": {
				label: "Tidak berpegang pada sudut pandang netral",
				summary: "Peringatan terakhir: Tidak berpegang pada sudut pandang netral"
			},
			"uw-paid4": {
				label: "Paid editing without disclosure under the Wikimedia Terms of Use",
				summary: "Final warning: Paid editing without disclosure under the Wikimedia Terms of Use"
			},
			"uw-spam4": {
				label: "Menambahkan pranala spam",
				summary: "Peringatan terakhir: Penambahan pranala spam"
			}
		},
		"Perilaku terhadap pengguna lain": {
			"uw-harass4": {
				label: "Melecehkan pengguna lain",
				summary: "Peringatan terakhir: Pelecehan terhadap pengguna lain"
			},
			"uw-npa4": {
				label: "Serangan pribadi terhadap pengguna tertentu",
				summary: "Peringatan terakhir: Serangan pribadi terhadap pengguna tertentu"
			}
		},
		"Penghilangan tag penghapusan": {
			"uw-afd4": {
				label: "Menghilangkan templat {{Afd}}",
				summary: "Peringatan terakhir: Penghilangan templat {{Afd}}"
			},
			"uw-blpprod4": {
				label: "Menghilangkan templat {{Prod blp}}",
				summary: "Peringatan terakhir: Penghilangan templat {{Prod blp}}"
			},
			"uw-idt4": {
				label: "Menghilangkan tag penghapusan berkas",
				summary: "Peringatan terakhir: Penghilangan tag penghapusan berkas"
			},
			"uw-speedy4": {
				label: "Menghilangkan tag penghapusan cepat",
				summary: "Peringatan terakhir: Penghilangan tag penghapusan cepat"
			}
		},
		"Lain-lain": {
			"uw-attempt4": {
				label: "Memicu filter penyuntingan",
				summary: "Peringatan terakhir: Memicu filter penyuntingan"
			},
			"uw-chat4": {
				label: "Menggunakan halaman pembicaraan sebagai forum",
				summary: "Peringatan terakhir: Penggunaan halaman pembicaraan sebagai forum"
			},
			"uw-create4": {
				label: "Membuat halaman yang tidak pantas",
				summary: "Peringatan terakhir: Pembuatan halaman yang tidak pantas"
			},
			"uw-mos4": {
				label: "Pedoman gaya",
				summary: "Peringatan terakhir: Format, tanggal, bahasa, dll. (Pedoman gaya)"
			},
			"uw-move4": {
				label: "Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus",
				summary: "Peringatan terakhir: Pemindahan halaman bertentangan dengan konvensi penamaan atau konsensus"
			},
			"uw-tpv4": {
				label: "Menyunting komentar pengguna lain di halaman pembicaraan",
				summary: "Peringatan terakhir: Penyuntingan komentar pengguna lain di halaman pembicaraan"
			},
			"uw-upload4": {
				label: "Menggunggah berkas nonensiklopedis",
				summary: "Peringatan terakhir: Pengunggahan berkas nonensiklopedis"
			}
		}
	},


	level4im: {
		"Peringatan umum": {
			"uw-vandalism4im": {
				label: "Vandalisme",
				summary: "Sekadar peringatan: Vandalisme"
			},
			"uw-delete4im": {
				label: "Menghapus konten, mengosongkan halaman",
				summary: "Sekadar peringatan: Penghapusan konten, pengosongan halaman"
			}
		},
		"Perilaku dalam artikel": {
			"uw-biog4im": {
				label: "Menambahkan informasi fitnah tanpa rujukan tentang orang yang masih hidup",
				summary: "Sekadar peringatan: Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup"
			},
			"uw-defamatory4im": {
				label: "Menambahkan konten yang memfitnah",
				summary: "Sekadar peringatan: Penambahan konten yang memfitnah"
			},
			"uw-image4im": {
				label: "Vandalisme terkait berkas dalam artikel",
				summary: "Sekadar peringatan: Vandalisme terkait berkas"
			},
			"uw-joke4im": {
				label: "Menggunakan lelucon yang tidak pantas",
				summary: "Sekadar peringatan: Penggunaan lelucon yang tidak pantas"
			},
			"uw-own4im": {
				label: "Mengklaim kepemilikan artikel",
				summary: "Sekadar peringatan: Klaim kepemilikan artikel"
			}
		},
		"Promosi dan spam": {
			"uw-advert4im": {
				label: "Menggunakan Wikipedia untuk beriklan atau promosi",
				summary: "Sekadar peringatan: Penggunaan Wikipedia untuk beriklan atau promosi"
			},
			"uw-spam4im": {
				label: "Menambahkan pranala spam",
				summary: "Sekadar peringatan: Penambahan pranala spam"
			}
		},
		"Perilaku terhadap pengguna lain": {
			"uw-harass4im": {
				label: "Melecehkan pengguna lain",
				summary: "Sekadar peringatan: Pelecehan terhadap pengguna lain"
			},
			"uw-npa4im": {
				label: "Serangan pribadi terhadap pengguna tertentu",
				summary: "Sekadar peringatan: Serangan pribadi terhadap pengguna tertentu"
			}
		},
		"Lain-lain": {
			"uw-create4im": {
				label: "Membuat halaman yang tidak pantas",
				summary: "Sekadar peringatan: Pembuatan halaman yang tidak pantas"
			},
			"uw-move4im": {
				label: "Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus",
				summary: "Sekadar peringatan: Pemindahan halaman bertentangan dengan konvensi penamaan atau konsensus"
			},
			"uw-upload4im": {
				label: "Menggunggah berkas nonensiklopedis",
				summary: "Sekadar peringatan: Pengunggahan berkas nonensiklopedis"
			}
		}
	},

	singlenotice: {
		"uw-aiv": {
			label: "Laporan AIV tidak benar",
			summary: "Pemberitahuan: Laporan AIV tidak benar"
		},
		"uw-autobiography": {
			label: "Membuat otobiografi",
			summary: "Pemberitahuan: Pembuatan otobiografi"
		},
		"uw-badcat": {
			label: "Menambahkan kategori yang salah",
			summary: "Pemberitahuan: Penambahan kategori yang salah"
		},
		"uw-badlistentry": {
			label: "Menambahkan entri yang tidak sepatutnya pada daftar",
			summary: "Pemberitahuan: Penambahan entri yang tidak sepatutnya pada daftar"
		},
		"uw-bite": {
			label: "\"Menggigit\" pendatang baru",
			summary: "Pemberitahuan: \"Menggigit\" pendatang baru",
			suppressArticleInSummary: true  // non-standard (user name, not article), and not necessary
		},
		"uw-coi": {
			label: "Konflik kepentingan",
			summary: "Pemberitahuan: Konflik kepentingan",
			heading: "Managing a conflict of interest"
		},
		"uw-controversial": {
			label: "Memasukkan materi kontroversial",
			summary: "Pemberitahuan: Pemasukan materi kontroversial"
		},
		"uw-copying": {
			label: "Menyalin teks ke halaman lain",
			summary: "Pemberitahuan: Penyalinan teks ke halaman lain"
		},
		"uw-crystal": {
			label: "Menambahkan informasi spekulatif atau belum dikonfirmasi",
			summary: "Pemberitahuan: Penambahan informasi spekulatif atau belum dikonfirmasi"
		},
		"uw-c&pmove": {
			label: "Pemindahan potong dan tempel",
			summary: "Pemberitahuan: Pemindahan potong dan tempel"
		},
		"uw-dab": {
			label: "Suntingan tidak benar pada halaman disambiguasi",
			summary: "Pemberitahuan: Suntingan tidak benar pada halaman disambiguasi"
		},
		"uw-date": {
			label: "Mengubah format tanggal secara tidak perlu",
			summary: "Pemberitahuan: Pengubahan format tanggal secara tidak perlu"
		},
		"uw-deadlink": {
			label: "Menghapus rujukan layak yang mengandung pranala mati",
			summary: "Pemberitahuan: Penghapusan rujukan layak yang mengandung pranala mati"
		},
		"uw-draftfirst": {
			label: "Merancang dalam ruang pengguna tanpa risiko penghapusan cepat",
			summary: "Pemberitahuan: Pertimbangkan merancang artikel Anda dalam [[Bantuan:Draf ruang pengguna|ruang pengguna]]"
		},
		"uw-editsummary": {
			label: "Tidak menggunakan ringkasan suntingan",
			summary: "Pemberitahuan: Tidak menggunakan ringkasan suntingan"
		},
		"uw-english": {
			label: "Tidak berkomunikasi dalam bahasa Indonesia",
			summary: "Pemberitahuan: Tidak berkomunikasi dalam bahasa Indonesia"
		},
		"uw-hasty": {
			label: "Menambahkan tag penghapusan cepat secara gegabah",
			summary: "Pemberitahuan: Izinkan pembuat artikel memperbaikinya sebelum diberi tag hapus"
		},
		"uw-inline-el": {
			label: "Menambahkan pranala luar ke bagian isi artikel",
			summary: "Pemberitahuan: Letakkan pranala pada bagian Pranala luar di akhir artikel"
		},
		"uw-italicize": {
			label: "Cetak miring judul buku, film, album, majalah, serial TV, dll.",
			summary: "Pemberitahuan: Cetak miring judul buku, film, album, majalah, serial TV, dll."
		},
		"uw-lang": {
			label: "Pengubahan yang tidak perlu antara bahasa Inggris Amerika dan Britania",
			summary: "Pemberitahuan: Pengubahan yang tidak perlu antara bahasa Inggris Amerika dan Britania",
			heading: "National varieties of English"
		},
		"uw-linking": {
			label: "Menambahkan pranala merah atau pengulangan pranala biru secara berlebihan",
			summary: "Pemberitahuan: Penambahan pranala merah atau pengulangan pranala biru secara berlebihan"
		},
		"uw-minor": {
			label: "Menandai suntingan kecil secara tidak benar",
			summary: "Pemberitahuan: Penandaan suntingan kecil secara tidak benar"
		},
		"uw-notenglish": {
			label: "Membuat artikel bukan dalam bahasa Indonesia",
			summary: "Pemberitahuan: Pembuatan artikel bukan dalam bahasa Indonesia"
		},
		"uw-notvote": {
			label: "Kita menggunakan konsensus, bukan pemungutan suara",
			summary: "Pemberitahuan: Kita menggunakan konsensus, bukan pemungutan suara"
		},
		"uw-plagiarism": {
			label: "Menyalin dari sumber domain publik tanpa atribusi",
			summary: "Pemberitahuan: Penyalinan dari sumber domain publik tanpa atribusi"
		},
		"uw-preview": {
			label: "Menggunakan tombol Lihat pratayang untuk menghindari kesalahan",
			summary: "Pemberitahuan: Penggunaan tombol Lihat pratayang untuk menghindari kesalahan"
		},
		"uw-redlink": {
			label: "Penghapusan pranala merah secara sembarangan",
			summary: "Pemberitahuan: Hati-hati saat menghapus pranala merah"
		},
		"uw-selfrevert": {
			label: "Mengembalikan uji coba sendiri",
			summary: "Pemberitahuan: Pengembalian uji coba sendiri"
		},
		"uw-socialnetwork": {
			label: "Wikipedia bukanlah jejaring sosial",
			summary: "Pemberitahuan: Wikipedia bukanlah jejaring sosial"
		},
		"uw-sofixit": {
			label: "Jangan ragu, Anda dapat memperbaikinya",
			summary: "Pemberitahuan: Jangan ragu, Anda dapat memperbaikinya"
		},
		"uw-spoiler": {
			label: "Menambahkan peringatan beberan atau menghapus beberan dari bagian terkait",
			summary: "Pemberitahuan: Jangan menghapus atau menandai kemungkinan 'beberan'"
		},
		"uw-talkinarticle": {
			label: "Pembicaraan dalam artikel",
			summary: "Pemberitahuan: Pembicaraan dalam artikel"
		},
		"uw-tilde": {
			label: "Tidak menandatangani pesan",
			summary: "Pemberitahuan: Tidak menandatangani pesan"
		},
		"uw-toppost": {
			label: "Menulis pesan di bagian atas halaman pembicaraan",
			summary: "Pemberitahuan: Penulisan pesan di bagian atas halaman pembicaraan"
		},
		"uw-userspace draft finish": {
			label: "Draf ruang pengguna yang terbengkalai",
			summary: "Pemberitahuan: Draf ruang pengguna yang terbengkalai"
		},
		"uw-vgscope": {
			label: "Menambahkan instruksi, cara curang, atau penelusuran permainan video",
			summary: "Pemberitahuan: Penambahan instruksi, cara curang, atau penelusuran permainan video"
		},
		"uw-warn": {
			label: "Menggunakan templat peringatan pengguna setelah mengembalikan vandalisme",
			summary: "Pemberitahuan: Penggunaan templat peringatan pengguna setelah mengembalikan vandalisme"
		}
	},


	singlewarn: {
		"uw-3rr": {
			label: "Melanggar aturan tiga kali pengembalian; lihat pula uw-ew",
			summary: "Peringatan: Pelanggaran aturan tiga kali pengembalian"
		},
		"uw-affiliate": {
			label: "Pemasaran afiliasi",
			summary: "Peringatan: Pemasaran afiliasi"
		},
		"uw-agf-sock": {
			label: "Menggunakan lebih dari satu akun (asumsikan niat baik)",
			summary: "Peringatan: Penggunaan lebih dari satu akun"
		},
		"uw-attack": {
			label: "Membuat halaman serangan",
			summary: "Peringatan: Pembuatan halaman serangan",
			suppressArticleInSummary: true
		},
		"uw-bizlist": {
			label: "Mempromosikan bisnis",
			summary: "Peringatan: Promosi bisnis"
		},
		"uw-botun": {
			label: "Nama pengguna bot",
			summary: "Peringatan: Nama pengguna bot"
		},
		"uw-canvass": {
			label: "Penganvasan",
			summary: "Peringatan: Penganvasan"
		},
		"uw-copyright": {
			label: "Pelanggaran hak cipta",
			summary: "Peringatan: Pelanggaran hak cipta"
		},
		"uw-copyright-link": {
			label: "Menautkan ke pelanggaran karya berhak cipta",
			summary: "Peringatan: Tautan ke pelanggaran karya berhak cipta"
		},
		"uw-copyright-new": {
			label: "Pelanggaran hak cipta (dengan penjelasan bagi pengguna baru)",
			summary: "Peringatan: Hindari masalah hak cipta",
			heading: "Wikipedia and copyright"
		},
		"uw-copyright-remove": {
			label: "Menghapus templat {{copyvio}} dari artikel",
			summary: "Peringatan: Penghapusan templat {{copyvio}}"
		},
		"uw-efsummary": {
			label: "Ringkasan suntingan memicu filter penyuntingan",
			summary: "Pemberitahuan: Ringkasan suntingan memicu filter penyuntingan"
		},
		"uw-ew": {
			label: "Perang suntingan (teguran keras)",
			summary: "Peringatan: Perang suntingan"
		},
		"uw-ewsoft": {
			label: "Perang suntingan (teguran lunak bagi pengguna baru)",
			summary: "Pemberitahuan: Perang suntingan"
		},
		"uw-hoax": {
			label: "Membuat cerita/kabar bohong",
			summary: "Peringatan: Pembuatan cerita bohong"
		},
		"uw-legal": {
			label: "Membuat ancaman hukum",
			summary: "Peringatan: Pembuatan ancaman hukum"
		},
		"uw-login": {
			label: "Menyunting setelah keluar log",
			summary: "Pemberitahuan: Penyuntingan setelah keluar log"
		},
		"uw-multipleIPs": {
			label: "Menggunakan lebih dari satu alamat IP",
			summary: "Peringatan: Penggunaan lebih dari satu alamat IP"
		},
		"uw-pinfo": {
			label: "Menambahkan info pribadi pengguna lain",
			summary: "Peringatan: Penambahan info pribadi pengguna lain"
		},
		"uw-salt": {
			label: "Membuat kembali artikel dalam daftar hitam judul dengan judul berbeda",
			summary: "Peringatan: Pembuatan kembali artikel yang tidak diperkenankan dengan judul berbeda"
		},
		"uw-socksuspect": {
			label: "Dugaan pengguna siluman",
			summary: "Peringatan: Dugaan [[WP:SILUMAN|pengguna siluman]]"  // of User:...
		},
		"uw-upv": {
			label: "Vandalisme halaman pengguna",
			summary: "Peringatan: Vandalisme halaman pengguna"
		},
		"uw-username": {
			label: "Nama pengguna tidak sesuai kebijakan",
			summary: "Pemberitahuan: Nama pengguna tidak sesuai kebijakan",
			suppressArticleInSummary: true  // not relevant for this template
		},
		"uw-coi-username": {
			label: "Nama pengguna tidak sesuai kebijakan, dan konflik kepentingan",
			summary: "Pemberitahuan: Kebijakan konflik kepentingan dan nama pengguna",
			heading: "Your username"
		},
		"uw-userpage": {
			label: "Subhalaman atau halaman pengguna tidak sesuai kebijakan",
			summary: "Pemberitahuan: Subhalaman atau halaman pengguna tidak sesuai kebijakan"
		},
		"uw-wrongsummary": {
			label: "Ketidaksesuaian atau ketidakakuratan penggunaan ringkasan suntingan",
			summary: "Pemberitahuan: Ketidaksesuaian atau ketidakakuratan penggunaan ringkasan suntingan"
		}
	}
};

Twinkle.warn.prev_article = null;
Twinkle.warn.prev_reason = null;

Twinkle.warn.callback.change_category = function twinklewarnCallbackChangeCategory(e) {
	var value = e.target.value;
	var sub_group = e.target.root.sub_group;
	sub_group.main_group = value;
	var old_subvalue = sub_group.value;
	var old_subvalue_re;
	if( old_subvalue ) {
		old_subvalue = old_subvalue.replace(/\d*(im)?$/, '' );
		old_subvalue_re = new RegExp( mw.RegExp.escape( old_subvalue ) + "(\\d*(?:im)?)$" );
	}

	while( sub_group.hasChildNodes() ){
		sub_group.removeChild( sub_group.firstChild );
	}

	// worker function to create the combo box entries
	var createEntries = function( contents, container, wrapInOptgroup ) {
		// due to an apparent iOS bug, we have to add an option-group to prevent truncation of text
		// (search WT:TW archives for "Problem selecting warnings on an iPhone")
		if ( wrapInOptgroup && $.client.profile().platform === "iphone" ) {
			var wrapperOptgroup = new Morebits.quickForm.element( {
				type: 'optgroup',
				label: 'Templat yang tersedia'
			} );
			wrapperOptgroup = wrapperOptgroup.render();
			container.appendChild( wrapperOptgroup );
			container = wrapperOptgroup;
		}

		$.each( contents, function( itemKey, itemProperties ) {
			var key = (typeof itemKey === "string") ? itemKey : itemProperties.value;

			var selected = false;
			if( old_subvalue && old_subvalue_re.test( key ) ) {
				selected = true;
			}

			// Slice out leading uw- from the menu display
			var elem = new Morebits.quickForm.element( {
				type: 'option',
				label: (value === 'custom' ? "{{" + key + "}}" : key.slice(3)) + ": " + itemProperties.label,
				value: key,
				selected: selected
			} );
			var elemRendered = container.appendChild( elem.render() );
			$(elemRendered).data("messageData", itemProperties);
		} );
	};

	if( value === "singlenotice" || value === "singlewarn" ) {
		// no categories, just create the options right away
		createEntries( Twinkle.warn.messages[ value ], sub_group, true );
	} else if( value === "custom" ) {
		createEntries( Twinkle.getPref("customWarningList"), sub_group, true );
	} else {
		// create the option-groups
		$.each( Twinkle.warn.messages[ value ], function( groupLabel, groupContents ) {
			var optgroup = new Morebits.quickForm.element( {
				type: 'optgroup',
				label: groupLabel
			} );
			optgroup = optgroup.render();
			sub_group.appendChild( optgroup );
			// create the options
			createEntries( groupContents, optgroup, false );
		} );
	}

	// clear overridden label on article textbox
	Morebits.quickForm.setElementTooltipVisibility(e.target.root.article, true);
	Morebits.quickForm.resetElementLabel(e.target.root.article);
	// hide the big red notice
	$("#tw-warn-red-notice").remove();
	// add custom label.redWarning
	Twinkle.warn.callback.change_subcategory(e);
};

Twinkle.warn.callback.change_subcategory = function twinklewarnCallbackChangeSubcategory(e) {
	var main_group = e.target.form.main_group.value;
	var value = e.target.form.sub_group.value;

	// Tags that don't take a linked article, but something else (often a username).
	// The value of each tag is the label next to the input field
	var notLinkedArticle = {
		"uw-agf-sock": "Optional username of other account (without User:) ",
		"uw-bite": "Username of 'bitten' user (without User:) ",
		"uw-socksuspect": "Username of sock master, if known (without User:) ",
		"uw-username": "Username violates policy because... ",
		"uw-aiv": "Optional username that was reported (without User:) "
	};

	if( main_group === 'singlenotice' || main_group === 'singlewarn' ) {
		if( notLinkedArticle[value] ) {
			if(Twinkle.warn.prev_article === null) {
				Twinkle.warn.prev_article = e.target.form.article.value;
			}
			e.target.form.article.notArticle = true;
			e.target.form.article.value = '';

			// change form labels according to the warning selected
			Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, false);
			Morebits.quickForm.overrideElementLabel(e.target.form.article, notLinkedArticle[value]);
		} else if( e.target.form.article.notArticle ) {
			if(Twinkle.warn.prev_article !== null) {
				e.target.form.article.value = Twinkle.warn.prev_article;
				Twinkle.warn.prev_article = null;
			}
			e.target.form.article.notArticle = false;
			Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, true);
			Morebits.quickForm.resetElementLabel(e.target.form.article);
		}
	}

	// add big red notice, warning users about how to use {{uw-[coi-]username}} appropriately
	$("#tw-warn-red-notice").remove();

	var $redWarning;
	if (value === "uw-username") {
		$redWarning = $("<div style='color: red;' id='tw-warn-red-notice'>{{uw-username}} seharusnya <b>tidak</b> digunakan untuk pelanggaran kebijakan nama pengguna secara <b>terang-terangan</b>. " +
			"Pelanggaran terang-terangan seharusnya dilaporkan langsung kepada UAA (via tab ARV pada Twinkle). " +
			"{{uw-username}} sebaiknya hanya digunakan dalam kasus ringan untuk berdiskusi dengan pengguna tersebut.</div>");
		$redWarning.insertAfter(Morebits.quickForm.getElementLabelObject(e.target.form.reasonGroup));
	} else if (value === "uw-coi-username") {
		$redWarning = $("<div style='color: red;' id='tw-warn-red-notice'>{{uw-coi-username}} seharusnya <b>tidak</b> digunakan untuk pelanggaran kebijakan nama pengguna secara <b>terang-terangan</b>. " +
			"Blatant violations should be reported directly to UAA (via Twinkle's ARV tab). " +
			"{{uw-coi-username}} sebaiknya hanya digunakan dalam kasus ringan untuk berdiskusi dengan pengguna tersebut.</div>");
		$redWarning.insertAfter(Morebits.quickForm.getElementLabelObject(e.target.form.reasonGroup));
	}
};

Twinkle.warn.callbacks = {
	getWarningWikitext: function(templateName, article, reason, isCustom) {
		var text = "{{subst:" + templateName;

		if (article) {
			// add linked article for user warnings
			text += '|1=' + article;
		}
		if (reason && !isCustom) {
			// add extra message
			if (templateName === 'uw-csd' || templateName === 'uw-probation' ||
				templateName === 'uw-userspacenoindex' || templateName === 'uw-userpage') {
				text += "|3=''" + reason + "''";
			} else {
				text += "|2=''" + reason + "''";
			}
		}
		text += '}}';

		if (reason && isCustom) {
			// we assume that custom warnings lack a {{{2}}} parameter
			text += " ''" + reason + "''";
		}

		return text + ' ~~~~';
	},
	preview: function(form) {
		var templatename = form.sub_group.value;
		var linkedarticle = form.article.value;
		var templatetext;

		templatetext = Twinkle.warn.callbacks.getWarningWikitext(templatename, linkedarticle,
			form.reason.value, form.main_group.value === 'custom');

		form.previewer.beginRender(templatetext, 'User_talk:' + mw.config.get('wgRelevantUserName')); // Force wikitext/correct username
	},
	main: function( pageobj ) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var messageData = params.messageData;

		var history_re = /<!-- Template:(uw-.*?) -->.*?(\d{1,2}:\d{1,2}, \d{1,2} \w+ \d{4}) \(UTC\)/g;
		var history = {};
		var latest = { date: new Date( 0 ), type: '' };
		var current;

		while( ( current = history_re.exec( text ) ) ) {
			var current_date = new Date( current[2] + ' UTC' );
			if( !( current[1] in history ) ||  history[ current[1] ] < current_date ) {
				history[ current[1] ] = current_date;
			}
			if( current_date > latest.date ) {
				latest.date = current_date;
				latest.type = current[1];
			}
		}

		var date = new Date();

		if( params.sub_group in history ) {
			var temp_time = new Date( history[ params.sub_group ] );
			temp_time.setUTCHours( temp_time.getUTCHours() + 24 );

			if( temp_time > date ) {
				if( !confirm( "Suatu " + params.sub_group + " yang identik telah diberikan dalam 24 jam terakhir.  \nAnda tetap ingin memberikan peringatan/pemberitahuan ini?" ) ) {
					pageobj.statelem.info( 'dibatalkan sesuai permintaan pengguna' );
					return;
				}
			}
		}

		latest.date.setUTCMinutes( latest.date.getUTCMinutes() + 1 ); // after long debate, one minute is max

		if( latest.date > date ) {
			if( !confirm( "Suatu " + latest.type + " diberikan dalam satu menit terakhir.  \nAnda tetap ingin memberikan peringatan/pemberitahuan ini?" ) ) {
				pageobj.statelem.info( 'dibatalkan sesuai permintaan pengguna' );
				return;
			}
		}

		var dateHeaderRegex = new RegExp( "^==+\\s*(?:" + date.getUTCMonthName() + '|' + date.getUTCMonthNameAbbrev() +
			")\\s+" + date.getUTCFullYear() + "\\s*==+", 'mg' );
		var dateHeaderRegexLast, dateHeaderRegexResult;
		while ((dateHeaderRegexLast = dateHeaderRegex.exec( text )) !== null) {
			dateHeaderRegexResult = dateHeaderRegexLast;
		}
		// If dateHeaderRegexResult is null then lastHeaderIndex is never checked. If it is not null but
		// \n== is not found, then the date header must be at the very start of the page. lastIndexOf
		// returns -1 in this case, so lastHeaderIndex gets set to 0 as desired.
		var lastHeaderIndex = text.lastIndexOf( "\n==" ) + 1;

		if( text.length > 0 ) {
			text += "\n\n";
		}

		if( messageData.heading ) {
			text += "== " + messageData.heading + " ==\n";
		} else if( !dateHeaderRegexResult || dateHeaderRegexResult.index !== lastHeaderIndex ) {
			Morebits.status.info( 'Info', 'Akan membuat judul tingkat 2 yang baru untuk tanggal tersebut, karena belum ada untuk bulan ini' );
			text += "== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ==\n";
		}
		text += Twinkle.warn.callbacks.getWarningWikitext(params.sub_group, params.article,
			params.reason, params.main_group === 'custom');

		if ( Twinkle.getPref('showSharedIPNotice') && mw.util.isIPAddress( mw.config.get('wgTitle') ) ) {
			Morebits.status.info( 'Info', 'Menambahkan pemberitahuan IP bersama' );
			text +=  "\n{{subst:Shared IP advice}}";
		}

		// build the edit summary
		var summary;
		if( params.main_group === 'custom' ) {
			switch( params.sub_group.substr( -1 ) ) {
				case "1":
					summary = "Catatan umum";
					break;
				case "2":
					summary = "Pemberitahuan";
					break;
				case "3":
					summary = "Peringatan";
					break;
				case "4":
					summary = "Peringatan terakhir";
					break;
				case "m":
					if( params.sub_group.substr( -3 ) === "4im" ) {
						summary = "Sekadar peringatan";
						break;
					}
					summary = "Pemberitahuan";
					break;
				default:
					summary = "Pemberitahuan";
					break;
			}
			summary += ": " + Morebits.string.toUpperCaseFirstChar(messageData.label);
		} else {
			summary = messageData.summary;
			if ( messageData.suppressArticleInSummary !== true && params.article ) {
				if ( params.sub_group === "uw-agf-sock" ||
						params.sub_group === "uw-socksuspect" ||
						params.sub_group === "uw-aiv" ) {  // these templates require a username
					summary += " dari [[:User:" + params.article + "]]";
				} else {
					summary += " di [[:" + params.article + "]]";
				}
			}
		}
		summary += "." + Twinkle.getPref("summaryAd");

		pageobj.setPageText( text );
		pageobj.setEditSummary( summary );
		pageobj.setWatchlist( Twinkle.getPref('watchWarnings') );
		pageobj.save();
	}
};

Twinkle.warn.callback.evaluate = function twinklewarnCallbackEvaluate(e) {
	var userTalkPage = 'User_talk:' + mw.config.get('wgRelevantUserName');

	// First, check to make sure a reason was filled in if uw-username was selected

	if(e.target.sub_group.value === 'uw-username' && e.target.article.value.trim() === '') {
		alert("Anda harus menuliskan alasan untuk menggunakan templat {{uw-username}}.");
		return;
	}

	// Find the selected <option> element so we can fetch the data structure
	var selectedEl = $(e.target.sub_group).find('option[value="' + $(e.target.sub_group).val() + '"]');

	// Then, grab all the values provided by the form
	var params = {
		reason: e.target.reason.value,
		main_group: e.target.main_group.value,
		sub_group: e.target.sub_group.value,
		article: e.target.article.value,  // .replace( /^(Image|Category):/i, ':$1:' ),  -- apparently no longer needed...
		messageData: selectedEl.data("messageData")
	};

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( e.target );

	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = "Peringatan telah diberikan, memuat kembali halaman pembicaraan dalam beberapa detik";

	var wikipedia_page = new Morebits.wiki.page( userTalkPage, 'Perubahan halaman pembicaraan pengguna' );
	wikipedia_page.setCallbackParameters( params );
	wikipedia_page.setFollowRedirect( true );
	wikipedia_page.load( Twinkle.warn.callbacks.main );
};
})(jQuery);


//</nowiki>
