<%inherit file='nextgisweb:templates/base.mako' />
<%! from nextgisweb.auth.util import _ %>
<div class="content-box">
    <table class="pure-table pure-table-horizontal" style="width: 100%;">
        <thead>
            <tr>
                <th style="width: 2em; text-align: inherit;">ID</th>
                <th style="width: 50%; text-align: inherit;">${tr(_("Full name"))}</th>
                <th style="width: 50%; text-align: inherit;">${tr(_("Group name"))}</th>
                <th style="width: 0px;">&nbsp;</th>
            </tr>
        </thead>
        <tbody>
            %for obj in obj_list:
                <tr>
                    <td>${obj.id}</td>
                    <td>${obj.display_name}</td>
                    <td>${obj.keyname}</td>
                    <td>
                        <a class="dijitIconEdit" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle" href="${request.route_url('auth.group.edit', id=obj.id)}"></a>
                    </td>
                </tr>
            %endfor
        </tbody>
    </table>
</div>