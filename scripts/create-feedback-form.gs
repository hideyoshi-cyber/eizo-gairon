/**
 * 感想提出フォームを作る Google Apps Script。
 * 使い方：https://script.google.com で新しいプロジェクトを作り、この内容を貼って createFeedbackForm を実行。
 * 実行すると、フォームの「回答用URL」と「編集用URL」がログに出る。回答用URLを
 * GitHub のリポジトリ変数 FEEDBACK_FORM_URL に設定する（docs/FEEDBACK_FORM.md）。
 */
function createFeedbackForm() {
  var form = FormApp.create('映像概論　感想の提出');
  form.setDescription(
    '成績は、出席と、毎回の感想の提出で決まります。感想は、内容の正誤では評価しません。1行でもかまいません。\n' +
    '掲載に同意した感想だけを、名前を伏せてサイトの「みんなの気づき」に載せることがあります。'
  );
  form.setCollectEmail(true);          // Googleアカウントでのログインが必要（メールアドレスを記録）
  form.setAllowResponseEdits(true);
  form.setConfirmationMessage('提出しました。ありがとうございました。');

  var lessons = [];
  for (var i = 1; i <= 60; i++) lessons.push('第' + i + '回');
  form.addListItem().setTitle('回').setChoiceValues(lessons).setRequired(true);

  form.addTextItem().setTitle('氏名').setRequired(true);

  form.addParagraphTextItem()
    .setTitle('感想')
    .setHelpText('今日の作品や授業で、気づいたこと・引っかかったことを書いてください。正誤は評価しません。')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('この感想を、名前を伏せてサイトに載せてよいですか？')
    .setChoiceValues(['載せてよい（匿名）', '載せない'])
    .setRequired(true);

  Logger.log('回答用URL: ' + form.getPublishedUrl());
  Logger.log('編集用URL: ' + form.getEditUrl());
}
